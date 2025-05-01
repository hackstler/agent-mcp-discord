import axios from 'axios';
import 'dotenv/config';

export async function runAgentGraphWorkflow(parameters: any) {
  const response = await axios.post(`${process.env.HOST}/run`, {
    tool: 'runWorkflow',
    parameters
  });
  return response.data;
}

export async function runWorkflow(tool: string, parameters: any) {
  const response = await axios.post(`${process.env.HOST}/tool`, {
    tool,
    parameters
  });
  return response.data;
}

export async function agentExecutor(toolInstruction: { tool: string; parameters: any }) {
  try {
    return await runWorkflow(toolInstruction.tool, toolInstruction.parameters);
  } catch (error: any) {
    console.error('❌ Error ejecutando herramienta MCP:', error.message);
    throw error;
  }
}
