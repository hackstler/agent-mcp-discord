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
      console.log(`👤 Usuario: ${state.userInput}`);
      return { userInput: state.userInput };
    }
  }))

  .addNode('processInput', new RunnableLambda({
    func: async (state: AgentState) => {
      console.log('\n🔄 Entrando en processInput...');
      console.log('🧠 Estado recibido:', JSON.stringify(state, null, 2));

      const { userInput, pendingAction, expectingGuildId, rememberedGuildId } = state;

      if (expectingGuildId && pendingAction) {
        const guildId = userInput.trim();
        if (!/^[0-9]+$/.test(guildId)) {
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

        if (!parsed.tool || !parsed.parameters) {
          if (Array.isArray(parsed.tools)) {
            return {
              finalResponse: {
                tool: 'talk',
                parameters: {
                  text: `Puedo usar estas herramientas: ${parsed.tools.join(', ')}`
                }
              }
            };
          }
          throw new Error('Respuesta sin tool válida.');
        }

        const { tool, parameters } = parsed;
        console.log('🧠 Intención detectada:', tool);

        if (!allowedTools.includes(tool)) {
          return {
            finalResponse: {
              tool: 'talk',
              parameters: { text: 'Esa herramienta no está disponible.' }
            }
          };
        }

        if (['createChannels', 'createRoles'].includes(tool)) {
          // solicitar guildId si falta
          if (!parameters.guildId || parameters.guildId === 'guildId') {
            if (rememberedGuildId) {
              parsed.parameters.guildId = rememberedGuildId;
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

          // detectar placeholder o falta de nombre de canal
          if (tool === 'createChannels') {
            const ch = parameters.channels;
            const isPlaceholder = Array.isArray(ch) && ch.length === 1 && ch[0] === 'nuevo-canal';
            if (!ch || ch.length === 0 || isPlaceholder) {
              return {
                finalResponse: {
                  tool: 'talk',
                  parameters: { text: '¿Cómo quieres que se llame el canal?' }
                },
                pendingAction: parsed,
                expectingGuildId: false
              };
            }
          }

          if (tool === 'createRoles' && (!parameters.roles || parameters.roles.length === 0)) {
            return {
              finalResponse: {
                tool: 'talk',
                parameters: { text: '¿Qué roles quieres crear en ese servidor?' }
              },
              pendingAction: parsed,
              expectingGuildId: false
            };
          }
        }

        if (tool === 'createIssue' && (!parameters.repoOwner || !parameters.repoName || !parameters.issueTitle || !parameters.summary)) {
          return {
            finalResponse: {
              tool: 'talk',
              parameters: { text: 'Falta información: necesito repoOwner, repoName, issueTitle y summary para crear el issue.' }
            },
            pendingAction: parsed
          };
        }

        await addMessageToMemory('user', `Usuario: ${userInput}`);
        await addMessageToMemory('assistant', `Asistente: ${raw}`);

        return { finalResponse: parsed };
      } catch (err) {
        console.warn('⚠️ Fallo al parsear salida de modelo');
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
      console.log(`🗣️ [Charla]: ${state.finalResponse?.parameters.text}`);
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

      console.log(`⚙️ Resultado ejecución: ${JSON.stringify(result)}`);

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
