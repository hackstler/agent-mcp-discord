// ✅ IMPLEMENTACIÓN CORRECTA PARA LLAMAINDEX 0.10.x

import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = path.resolve(__dirname, '../storage/memory.json');

interface MessageEntry {
  role: 'user' | 'assistant';
  message: string;
}

let memory: MessageEntry[] = [];

export async function initMemory(): Promise<void> {
  try {
    const data = await fs.readFile(STORAGE_PATH, 'utf-8');
    memory = JSON.parse(data);
    console.log('✅ Memoria cargada desde disco.');
  } catch (e) {
    console.warn('⚠️ No se pudo cargar memoria. Se usará una vacía.');
    memory = [];
  }
}

export async function addMessageToMemory(role: 'user' | 'assistant', message: string): Promise<void> {
  memory.push({ role, message });
  await persistMemory();
}

export async function getRelevantHistory(prompt: string): Promise<{ role: string; content: string }[]> {
  // Recupéralo todo (versión simple). Mejora con RAG más adelante.
  const history = memory.slice(-6); // últimos 6 mensajes (3 pares)
  return history.map(m => ({ role: m.role, content: m.message }));
}

async function persistMemory(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    await fs.writeFile(STORAGE_PATH, JSON.stringify(memory, null, 2), 'utf-8');
  } catch (e) {
    console.error('❌ Error al guardar la memoria en disco:', e);
  }
}
