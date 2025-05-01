
import { langgraphAgent } from '../agents/langgraphAgent';
import { agentExecutor } from '../tools/mcpTools';

async function main() {
  console.log('🤖 Bienvenido a AfterCoding CLI Agent!');

  while (true) {
    const userInput = await promptUser("> ");

    if (userInput.toLowerCase() === 'exit') {
      console.log('👋 ¡Hasta pronto!');
      process.exit(0);
    }

    const result = await langgraphAgent.invoke({ userInput });

    if (!result || !result.finalResponse) {
      console.error('❌ Error: No se pudo procesar la instrucción.');
      continue;
    }

    const { tool, parameters } = result.finalResponse;

    if (tool === 'talk') {
      console.log(`🗣️ [Charla]: ${parameters.text}`);
      continue;
    }

    try {
      const execResult = await agentExecutor(result.finalResponse);
      console.log(`⚙️ Resultado ejecución: ${JSON.stringify(execResult)}`);
    } catch (err) {
      console.error(`❌ Error ejecutando herramienta MCP: ${(err as Error).message}`);
    }
  }
}

function promptUser(promptText: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(promptText);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

main();
