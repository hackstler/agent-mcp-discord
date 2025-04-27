import fetch from 'node-fetch';
import { Response } from 'node-fetch';
/** Initial state required to invoke the agent */
interface InitialState {
  guildId: string;
  roles: Array<{ name: string; permissions?: bigint }>;
  channels: string[];
  channelId: string;
  repoOwner: string;
  repoName: string;
  issueTitle: string;
}

/** Client example that consumes the MCP Server */
async function runConversation(): Promise<void> {
  const toolsRes: Response  = await fetch('http://localhost:4000/tools');
  const tools = await toolsRes.json();
  console.log('Available tools:', tools);

  const initialState: InitialState = {
    guildId: '1365186940864958567',
    roles: [
      { name: 'Student' },
      { name: 'Instructor' },
      { name: 'Admin' }
    ],
    channels: ['ofertas-trabajo', 'coding-challenges', 'build-together', 'libros', 'cervezas, software y lágrimas', 'Bienvenida'],
    channelId: '1365186940864958570',
    repoOwner: 'hackstler',
    repoName: 'agent-mcp-discord',
    issueTitle: 'Resumen de Discord'
  };
  
  const runRes = await fetch('http://localhost:4000/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(initialState)
  });
  const result = await runRes.json();
  console.log('Final agent result:', result);
}

runConversation().catch(console.error);