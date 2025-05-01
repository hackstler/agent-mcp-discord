// src/server/index.ts
import 'dotenv/config';
import { startApp } from '../config/setupApp';
import { initServices } from '../config/initServices';

async function main() {
  try {
    await initServices();
    await startApp();
  } catch (err) {
    console.error('💥 Error crítico al iniciar el servidor:', err);
    process.exit(1);
  }
}

main();
