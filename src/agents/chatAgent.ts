
import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { RunnableLambda } from '@langchain/core/runnables';
import { agentExecutor, runAgentGraphWorkflow } from '../tools/dispatcher';
import { AgentState } from './agentState';
import { getRelevantHistory, addMessageToMemory } from './memory';
import { systemPrompt } from '../prompts/systemPrompts';
import 'dotenv/config';

const allowedTools = [
  'createGuild',
  'createRoles',
  'createChannels',
  'fetchMessages',
  'summarize',
  'createIssue',
  'runWorkflow',
  'talk'
];

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-1.5-flash',
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.3
});

const AgentAnnotation = Annotation.Root({
  userInput: Annotation<string>(),
  lastToolUsed: Annotation<string | undefined>(),
  reasoning: Annotation<string | undefined>(),
  finalResponse: Annotation<{ tool: string; parameters: any } | undefined>(),
  pendingAction: Annotation<{ tool: string; parameters: any } | undefined>(),
  expectingGuildId: Annotation<boolean>(),
  rememberedGuildId: Annotation<string | undefined>(),
});

export const langgraphAgent = new StateGraph(AgentAnnotation)

  .addNode('input', new RunnableLambda({
    func: async (state: AgentState) => {
      console.log(`👤 User: ${state.userInput}`);
      return { userInput: state.userInput };
    }
  }))

  .addNode('processInput', new RunnableLambda({
    func: async (state: AgentState) => {
      console.log('\n🔄 Entering processInput...');
      console.log('🧠 Received state:', JSON.stringify(state, null, 2));

      const { userInput, pendingAction, expectingGuildId, rememberedGuildId } = state;

      if (expectingGuildId && pendingAction) {
        const guildId = userInput.trim();
        if (!/^\d+$/.test(guildId)) {
          return {
            finalResponse: {
              tool: 'talk',
              parameters: {
                text: 'Eso no parece un ID válido de Discord. Por favor, mándame solo el número del servidor.'
              }
            },
            expectingGuildId: true,
            pendingAction
          };
        }

        const updatedAction = {
          tool: pendingAction.tool,
          parameters: {
            ...pendingAction.parameters,
            guildId
          }
        };

        await addMessageToMemory('user', `Usuario: ${guildId}`);
        return {
          finalResponse: updatedAction,
          rememberedGuildId: guildId,
          expectingGuildId: false,
          pendingAction: undefined
        };
      }

      const history = await getRelevantHistory(userInput);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userInput }
      ];

      const response = await model.invoke(messages);
      let raw = (response.content as string).trim();
      console.log('🧪 DEBUG: rawContent:', raw);

      raw = raw.replace(/^```json|```$/g, '').replace(/^```/, '').trim();
      if (raw.includes('Asistente:')) {
        raw = raw.split('Asistente:').pop()?.trim() ?? raw;
      }

      try {
        const parsed = JSON.parse(raw);

        if (!parsed.tool || !parsed.parameters) throw new Error();

        const { tool, parameters } = parsed;
        console.log('🧠 Detected intent:', tool);

        if (!allowedTools.includes(tool)) {
          return {
            finalResponse: {
              tool: 'talk',
              parameters: { text: 'Esa herramienta no está disponible.' }
            }
          };
        }

        if (["createChannels", "createRoles"].includes(tool) && (!parameters.guildId || parameters.guildId === 'guildId')) {
          if (rememberedGuildId) {
            parameters.guildId = rememberedGuildId;
            return { finalResponse: parsed };
          }

          return {
            finalResponse: {
              tool: 'talk',
              parameters: { text: '¿Cuál es el ID del servidor de Discord donde quieres hacerlo?' }
            },
            pendingAction: parsed,
            expectingGuildId: true
          };
        }

        await addMessageToMemory('user', `Usuario: ${userInput}`);
        await addMessageToMemory('assistant', `Asistente: ${raw}`);

        return { finalResponse: parsed };
      } catch (err) {
        console.warn('⚠️ Failed to parse model output');
        return {
          finalResponse: {
            tool: 'talk',
            parameters: { text: "No entendí bien tu mensaje. ¿Puedes reformularlo?" }
          }
        };
      }
    }
  }))

  .addNode('talk', new RunnableLambda({
    func: async (state: AgentState) => {
      console.log(`🗣️ [Talk]: ${state.finalResponse?.parameters.text}`);
      return state;
    }
  }))

  .addNode('executeAction', new RunnableLambda({
    func: async (state: AgentState) => {
      const { finalResponse } = state;
      if (!finalResponse) throw new Error('No hay acción para ejecutar.');

      const { tool, parameters } = finalResponse;

      let result;

      if (tool === 'runWorkflow') {
        result = await runAgentGraphWorkflow(parameters);
      } else {
        result = await agentExecutor(finalResponse);
      }

      console.log(`⚙️ Execution result: ${JSON.stringify(result)}`);

      return {
        ...state,
        finalResponse: {
          tool: 'talk',
          parameters: {
            text: `✅ Se ejecutó correctamente la acción '${tool}'.`
          }
        }
      };
    }
  }))

  .addConditionalEdges('processInput', (state) =>
    state.finalResponse?.tool === 'talk' ? 'talk' : 'executeAction'
  )

  .addEdge(START, 'input')
  .addEdge('input', 'processInput')
  .addEdge('talk', END)
  .addEdge('executeAction', END)

  .compile();
