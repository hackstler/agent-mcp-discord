// src/server/config/initServices.ts
import { initMemory } from '../agents/memory';
import { initGemini } from '../geminiClient';
import { initGitHub } from '../githubClient';
import { loginDiscord } from '../discordClient';
import { setupDiscordEvents } from '../discordEvents';

export async function initServices() {
  console.log('🧠 Inicializando memoria...');
  initGemini();
  await initMemory();
  console.log('🤖 Iniciando clientes externos...');
  await loginDiscord();
  setupDiscordEvents();
  initGitHub();
}
