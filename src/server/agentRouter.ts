import express from 'express';
import type { RequestHandler } from 'express';
import { langgraphAgent } from '../agents/langgraphAgent';
import type { AgentState } from '../agents/agentState';

const router = express.Router();

// Memoria en el proceso para cada sesión
const sessionStates = new Map<string, AgentState>();
const messageHandler: RequestHandler = async (req, res) => {
  const { userInput } = req.body;

  if (!userInput) {
    res.status(400).json({ error: 'Missing userInput' });
    return;
  }

  const sessionId = req.ip;
  if (!sessionId) {
    res.status(400).json({ error: 'Missing sessionId' });
    return;
  } 
  const previousState = sessionStates.get(sessionId) || {};

  console.log('\n--- 📥 NUEVO MENSAJE DEL USUARIO ---');
  console.log('💬 Entrada:', userInput);
  console.log('📦 Estado anterior:', JSON.stringify(previousState, null, 2));

  try {
    const newState = await langgraphAgent.invoke({
      ...previousState,
      userInput
    });

    sessionStates.set(sessionId, newState as AgentState);

    console.log('📤 Estado actualizado:', JSON.stringify(newState, null, 2));
    console.log('🧠 expectingGuildId:', newState.expectingGuildId);
    console.log('🧠 rememberedGuildId:', newState.rememberedGuildId);
    console.log('🧠 pendingAction:', JSON.stringify(newState.pendingAction, null, 2));

    res.json({ success: true, response: newState.finalResponse });
  } catch (error) {
    console.error('❌ Error invoking agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Agent invocation failed'
    });
  }
};


router.post('/message', messageHandler);

export const agentRouter = router;
