import 'dotenv/config';
console.log('GITHUB_TOKEN?', process.env.GITHUB_TOKEN?.slice(0, 6), '...');
import express, { Request, Response } from 'express';
import { agentGraph } from './agentGraph';
import { initGitHub } from './githubClient';
import { initGemini } from './geminiClient';
import { loginDiscord } from './discordClient';
import { setupDiscordEvents } from './discordEvents';

async function main() {
    await loginDiscord();
    setupDiscordEvents();
    initGemini();
    initGitHub();
  }
  
  main();

const app = express();
app.use(express.json());

app.get('/tools', (_req: Request, res: Response) => {
    const tools: string[] = Object.keys(agentGraph.nodes);
    res.json({ tools });
  });
  
app.post('/run', async (req: Request, res: Response) => {
  try {
    const initialState = req.body;
    const finalState = await agentGraph.invoke(initialState);
    res.json({ success: true, state: finalState });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`✅ MCP Server listening on http://localhost:${PORT}`);
});