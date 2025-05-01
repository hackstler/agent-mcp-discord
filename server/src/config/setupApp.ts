// src/server/config/setupApp.ts
import express, { Request, Response } from 'express';
import { configureCors } from '../server/cors';
import { agentRouter } from '../server/chatAgentRouter';
import { agentGraph } from '../workflowAgentGraph';

export async function startApp() {
  console.log('🚀 Lanzando servidor Express...');
  const app = express();
  app.use(express.json());
  configureCors(app);

  // Rutas de agente conversacional
  app.use('/agent', agentRouter);

// Rutas de herramientas
app.get('/tools/list', (_req: Request, res: Response) => {
    const tools = Object.keys(agentGraph.nodes);
    res.json({ tools });
  });
  
  app.post('/tool/execute', async (req: Request, res: Response) => {
    try {
      const { tool, parameters } = req.body;
      if (!tool || !parameters) throw new Error('Missing tool or parameters.');
  
      const node = agentGraph.nodes[tool as keyof typeof agentGraph.nodes];
      const result = await node.invoke(parameters);
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('❌ Error en /tool/execute:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  app.post('/workflow/run', async (req: Request, res: Response) => {
    try {
      const { tool, parameters } = req.body;
      if (!tool || !parameters) throw new Error('Missing tool or parameters.');
  
      const initialState = { ...parameters };
      const finalState = await agentGraph.invoke(initialState);
  
      res.json({ success: true, state: finalState });
    } catch (error: any) {
      console.error('❌ Error en /workflow/run:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`✅ MCP Server listening on http://localhost:${PORT}`);
  });
}
