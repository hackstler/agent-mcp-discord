
import express from 'express';
import type { RequestHandler } from 'express';
import { langgraphAgent } from '../agents/chatAgent';
import type { AgentState } from '../agents/agentState';

const router = express.Router();

const messageHandler: RequestHandler = async (req, res) => {
  const { userInput } = req.body;

  if (!userInput || typeof userInput !== 'string') {
    res.status(400).json({ error: 'No userInput' });
    return;
  }

  try {
    const initialState: AgentState = { userInput };
    const finalState = await langgraphAgent.invoke(initialState);

    res.json({
      success: true,
      response: finalState.finalResponse
    });

  } catch (error) {
    console.error('❌ Error invoking agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error in agentRouter'
    });
  }
};

router.post('/message', messageHandler);

export const agentRouter = router;
