import { langgraphAgent } from '../agents/chatAgent';
import { agentExecutor } from '../tools/dispatcher';

async function main() {
  console.log('🤖 Welcome to AfterCoding CLI Agent!');

  while (true) {
    const userInput = await promptUser("> ");

    if (userInput.toLowerCase() === 'exit') {
      console.log('👋 Goodbye!');
      process.exit(0);
    }

    const result = await langgraphAgent.invoke({ userInput });

    if (!result || !result.finalResponse) {
      console.error('❌ Error: Could not process the instruction.');
      continue;
    }

    const { tool, parameters } = result.finalResponse;

    if (tool === 'talk') {
      console.log(`🗣️ [Chat]: ${parameters.text}`);
      continue;
    }

    try {
      const execResult = await agentExecutor(result.finalResponse);
      console.log(`⚙️ Execution result: ${JSON.stringify(execResult)}`);
    } catch (err) {
      console.error(`❌ Error executing MCP tool: ${(err as Error).message}`);
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
