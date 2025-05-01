import fetch from 'node-fetch';
import { Response } from 'node-fetch';
import 'dotenv/config';

interface InitialState {
  guildId: string;
  roles: Array<{ name: string; permissions?: bigint }>;
  channels: string[];
  channelId: string;
  repoOwner: string;
  repoName: string;
  issueTitle: string;
}

async function runConversation(): Promise<void> {
  const toolsRes: Response  = await fetch(`${process.env.HOST}/tools/list`); 
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

  const runRes = await fetch(`${process.env.HOST}/workflow/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: 'runWorkflow', parameters: initialState })
  });

  const result = await runRes.json();
  console.log('Final agent result:', result);
}

runConversation().catch(console.error);
