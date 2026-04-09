// ─── Server Entry Point ───
// Starts the Express server.

import { createApp } from './app.js';
import { env } from './config/env.js';
import { log } from './utils/logger.js';

const app = createApp();

app.listen(env.port, () => {
  log(`
  ╔═══════════════════════════════════════════════════╗
  ║          🏛️  CivicConnect API Server              ║
  ╠═══════════════════════════════════════════════════╣
  ║  Status:      ✅ Running                          ║
  ║  Port:        ${String(env.port).padEnd(36)}║
  ║  Environment: ${env.nodeEnv.padEnd(36)}║
  ║  API Base:    http://localhost:${env.port}/api${' '.repeat(10)}║
  ║  Health:      http://localhost:${env.port}/api/health${' '.repeat(3)}║
  ╚═══════════════════════════════════════════════════╝
  `);
});
