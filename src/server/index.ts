import 'dotenv/config';
import express, { Request, Response } from 'express';
import { agentGraph } from '../agentGraph';
import { langgraphAgent } from '../agents/langgraphAgent';
import { initGitHub } from '../githubClient';
import { initGemini } from '../geminiClient';
import { loginDiscord } from '../discordClient';
import { setupDiscordEvents } from '../discordEvents';
import { agentRouter } from './agentRouter';
import { configureCors } from './cors';
import { initMemory } from '../agents/memory'; // ✅ NUEVO

// Inicialización principal
async function main() {
  try {
    console.log('🧠 Inicializando memoria...');
    await initMemory(); // ✅ Esperamos a que la memoria se cargue o cree

    console.log('🤖 Iniciando clientes externos...');
    await loginDiscord();
    setupDiscordEvents();
    initGemini();
    initGitHub();

    console.log('🚀 Lanzando servidor Express...');
    const app = express();
    app.use(express.json());
    configureCors(app);

    app.use('/agent', agentRouter);

    app.get('/tools', (_req: Request, res: Response) => {
      const tools: string[] = Object.keys(agentGraph.nodes);
      res.json({ tools });
    });

    app.post('/tool', async (req: Request, res: Response) => {
      try {
        const { tool, parameters } = req.body;
        if (!tool || !parameters) throw new Error('Missing tool or parameters.');

        if (!(tool in agentGraph.nodes)) {
          throw new Error(`Tool '${tool}' not found in graph.`);
        }

        const node = agentGraph.nodes[tool as keyof typeof agentGraph.nodes];
        const result = await node.invoke(parameters);

        res.json({ success: true, result });
      } catch (error: any) {
        console.error('❌ Error en /tool:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/run', async (req: Request, res: Response) => {
      try {
        const { tool, parameters } = req.body;
        if (!tool || !parameters) throw new Error('Missing tool or parameters.');

        const initialState = { ...parameters };
        const finalState = await agentGraph.invoke(initialState);

        res.json({ success: true, state: finalState });
      } catch (error: any) {
        console.error('❌ Error en /run:', error.message);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    const PORT = Number(process.env.PORT) || 4000;
    app.listen(PORT, () => {
      console.log(`✅ MCP Server listening on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('💥 Error crítico al iniciar el servidor:', err);
    process.exit(1);
  }
}

main();
