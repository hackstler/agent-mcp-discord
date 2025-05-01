export type ToolAction<TParams = any> = {
  tool: string
  parameters: TParams
}

export interface AgentState {
  userInput: string;
  lastToolUsed?: string;
  reasoning?: string;
  finalResponse?: { tool: string; parameters: any };
  pendingAction?: { tool: string; parameters: any };
  expectingGuildId?: boolean;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  pendingGuildId?: string;
  pendingChannelName?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  rememberedGuildId?: string; // 👈 añadido para recordar nombre del canal
  // ... otras propiedades ...
}