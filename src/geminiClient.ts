import { GoogleGenerativeAI } from '@google/generative-ai';
let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

export function initGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('NO GEMINI_API_KEY en .env');
  const genAI = new GoogleGenerativeAI(key);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-04-17'
  });
}

export { model };
