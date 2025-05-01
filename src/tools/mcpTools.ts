import axios from 'axios';


export async function agentExecutor(toolInstruction: { tool: string; parameters: any }) {
  try {
    const response = await axios.post('http://localhost:4000/tool', {
      tool: toolInstruction.tool,
      parameters: toolInstruction.parameters
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error ejecutando herramienta MCP:', error.message);
    throw error;
  }
}

