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
    // Aseguramos que la carpeta existe
    await fs.writeFile(STORAGE_PATH, '[]', 'utf-8');
    await fs.mkdir(path.dirname(STORAGE_PATH), { recursive: true });
    // Leemos memoria de disco
    const data = await fs.readFile(STORAGE_PATH, 'utf-8');
    memory = JSON.parse(data);
    console.log('✅ Memoria cargada desde disco.');
  } catch (e) {
    // Si no se puede leer (no existe o error), inicializamos vacía y persistimos
    console.warn('⚠️ No se pudo cargar memoria o no existe. Se inicializa vacía.');
    memory = [];
    await persistMemory();
  }
}

export async function addMessageToMemory(role: 'user' | 'assistant', message: string): Promise<void> {
  memory.push({ role, message });
  await persistMemory();
}

export async function getRelevantHistory(prompt: string): Promise<{ role: string; content: string }[]> {
  // Versión simple: últimos 6 mensajes
  const history = memory.slice(-6);
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
