import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
let model: ChatGoogleGenerativeAI;

export function initGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('NO GEMINI_API_KEY en .env');
  model = new ChatGoogleGenerativeAI({
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3
  });

}

export { model };
