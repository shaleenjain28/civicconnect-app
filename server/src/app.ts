// ─── Express App Factory ───
// Creates and configures the Express application.
// Separated from index.ts for testability.

import express from 'express';
import { applySecurityMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import { httpLogger } from './utils/logger.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import issueRoutes from './routes/issues.routes.js';
import voteRoutes from './routes/votes.routes.js';
import commentRoutes from './routes/comments.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import userRoutes from './routes/users.routes.js';
import aiRoutes from './routes/ai.routes.js';

export function createApp() {
  const app = express();

  // ── 1. Security middleware (helmet, cors, rate-limit) ──
  applySecurityMiddleware(app);

  // ── 2. Body parsers ──
  app.use(express.json({ limit: '10mb' }));      // JSON body (10MB for base64 images)
  app.use(express.urlencoded({ extended: true })); // Form data

  // ── 3. HTTP request logging ──
  app.use(httpLogger);

  // ── 4. Health check ──
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // ── 5. API Routes ──
  app.use('/api/auth', authRoutes);
  app.use('/api/issues', issueRoutes);
  app.use('/api/issues', voteRoutes);     // /api/issues/:id/vote
  app.use('/api/issues', commentRoutes);  // /api/issues/:id/comments
  app.use('/api/departments', departmentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/ai', aiRoutes);

  // ── 6. 404 handler ──
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ── 7. Global error handler (must be last) ──
  app.use(errorHandler);

  return app;
}
