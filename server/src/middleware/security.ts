// ─── Security Middleware ───
// Three layers of protection applied to every request:
// 1. Helmet  — sets secure HTTP headers (CSP, HSTS, X-Frame, etc.)
// 2. CORS    — controls which domains can call the API
// 3. Rate Limiter — prevents abuse and DDoS

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';
import { env } from '../config/env.js';

export function applySecurityMiddleware(app: Express) {
  // ── 1. Helmet: Sets 15+ security HTTP headers
  // What it prevents: XSS, clickjacking, MIME sniffing, content injection
  app.use(helmet());

  // ── 2. CORS: Cross-Origin Resource Sharing
  // What it prevents: Unauthorized domains calling our API
  // Only our two frontends (citizen app + dashboard) are allowed
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // Cache preflight for 24h
    })
  );

  // ── 3a. General Rate Limiter: 100 requests per 15 minutes per IP
  // What it prevents: DDoS, API abuse, scraping
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // Max 100 requests per window
    standardHeaders: true,      // Send rate limit info in headers
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });
  app.use(generalLimiter);

  // ── 3b. Auth Rate Limiter: 10 requests per 15 minutes per IP
  // What it prevents: Brute-force login attempts
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many auth attempts. Please try again later.' },
  });
  app.use('/api/auth', authLimiter);

  // ── 3c. AI Rate Limiter: 20 requests per 15 minutes per IP
  // What it prevents: Gemini API abuse (costs money)
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many AI requests. Please try again later.' },
  });
  app.use('/api/ai', aiLimiter);
}
