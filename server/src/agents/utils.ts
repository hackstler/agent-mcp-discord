import { model } from "../geminiClient";
import { domainFilterPrompt } from "../prompts/systemPrompts";

export async function isValidDomainQuestion(userInput: string): Promise<boolean> {
    const response = await model.invoke([
      { role: 'system', content: domainFilterPrompt },
      { role: 'user', content: userInput }
    ]);
  
    const output = String(response.content).trim().toLowerCase();
    return output === 'true';
  }