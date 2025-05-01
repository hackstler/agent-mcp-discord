import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { RunnableLambda } from '@langchain/core/runnables';
import { agentExecutor } from '../tools/mcpTools';
import { AgentState } from './agentState';
import { getRelevantHistory, addMessageToMemory } from './memory';
import 'dotenv/config';

const systemPrompt = `
Eres AfterCodingBot, un agente de Discord y GitHub.

Herramientas permitidas:
- createGuild: { name: string }
- createRoles: { guildId: string, roles: Array<{ name: string, permissions?: string[] }> }
- createChannels: { guildId: string, channels: string[] }
- fetchMessages: { channelId: string }
- summarize: { messages: string[] }
- createIssue: { repo: string, title: string, body: string }

🧠 Tu objetivo:
- Usa SOLO las herramientas definidas.
- No inventes herramientas nuevas ni campos nuevos.
- Si no entiendes la instrucción, responde:
{
  "tool": "talk",
  "parameters": { "text": "No entendí bien tu solicitud, ¿puedes explicarlo mejor?" }
}
- No expliques procedimientos. Devuelve SOLO JSON, nada más.

Ejemplos:
{
  "tool": "createChannels",
  "parameters": { "guildId": "1234567890", "channels": ["proyectos", "eventos"] }
}

{
  "tool": "talk",
  "parameters": { "text": "¡Hola! ¿En qué puedo ayudarte hoy?" }
}`;

const allowedTools = [
  "createGuild",
  "createRoles",
  "createChannels",
  "fetchMessages",
  "summarize",
  "createIssue",
  "talk"
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

      if (state.expectingGuildId && state.pendingAction) {
        const guildId = state.userInput.trim();
        if (!/^[0-9]+$/.test(guildId)) {
          return {
            finalResponse: {
              tool: 'talk',
              parameters: {
                text: 'Eso no parece un ID válido de Discord. Por favor, mándame solo el número del servidor.'
              }
            },
            expectingGuildId: true,
            pendingAction: state.pendingAction
          };
        }

        const updatedAction = {
          tool: state.pendingAction.tool,
          parameters: {
            ...state.pendingAction.parameters,
            guildId
          }
        };

        console.log('✅ Acción completada con guildId:', updatedAction);

        await addMessageToMemory(`user`, `Usuario: ${guildId}`);

        return {
          finalResponse: updatedAction,
          rememberedGuildId: guildId,
          expectingGuildId: false,
          pendingAction: undefined
        };
      }

      const history = await getRelevantHistory(state.userInput);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: state.userInput }
      ];

      const response = await model.invoke(messages);

      let raw = (response.content as string).trim();
      console.log('🧪 DEBUG: rawContent:', raw);

      if (raw.startsWith('```') && raw.endsWith('```')) {
        raw = raw.slice(3, -3).trim();
        if (raw.startsWith('json')) {
          raw = raw.slice(4).trim();
        }
      }

      try {
        // Limpieza previa antes de parsear
if (raw.includes('Asistente:')) {
  raw = raw.split('Asistente:').pop()!.trim();
}

if (raw.startsWith('```') && raw.endsWith('```')) {
  raw = raw.slice(3, -3).trim();
  if (raw.startsWith('json')) {
    raw = raw.slice(4).trim();
  }
}

        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && 'tool' in parsed && 'parameters' in parsed) {
          const tool = parsed.tool;
          const params = parsed.parameters;
          console.log('🧠 Intención detectada:', tool);

          if (!allowedTools.includes(tool)) {
            return {
              finalResponse: {
                tool: 'talk',
                parameters: { text: 'Esa herramienta no está disponible.' }
              }
            };
          }

          if (["createChannels", "createRoles"].includes(tool) && (!params.guildId || params.guildId === 'guildId')) {
            if (state.rememberedGuildId) {
              parsed.parameters.guildId = state.rememberedGuildId;
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

          await addMessageToMemory(`user`, `Usuario: ${state.userInput}`);
          await addMessageToMemory(`assistant`, `Asistente: ${raw}`);

          return { finalResponse: parsed };
        }

        throw new Error('Respuesta sin estructura esperada.');
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
      if (!state.finalResponse) throw new Error('No hay acción para ejecutar.');
  
      const tool = state.finalResponse.tool;
      const params = state.finalResponse.parameters;
  
      if (["createChannels", "createRoles"].includes(tool) && (!params.guildId || params.guildId === 'guildId')) {
        params.guildId = "1365186940864958567";
      }
  
      const validTools = ["createGuild", "createRoles", "createChannels", "fetchMessages", "summarize", "createIssue"];
      if (!validTools.includes(tool)) {
        console.log(`⚠️ Tool inválida recibida: "${tool}". No se ejecuta.`);
        return state;
      }
  
      const result = await agentExecutor(state.finalResponse);
      console.log(`⚙️ Resultado ejecución: ${JSON.stringify(result)}`);
  
      // ✅ Generar respuesta hablada para el usuario
      const talkResponse = {
        tool: 'talk',
        parameters: {
          text: `✅ Se ejecutó correctamente la acción '${tool}'.`
        }
      };
  
      return {
        ...state,
        finalResponse: talkResponse
      };
    }
  }))
  

  .addConditionalEdges('processInput', (state: AgentState) => {
    return state.finalResponse?.tool === 'talk' ? 'talk' : 'executeAction';
  })

  .addEdge(START, 'input')
  .addEdge('input', 'processInput')
  .addEdge('talk', END)
  .addEdge('executeAction', END)

  .compile();
