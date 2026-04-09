// ─── Global Error Handler ───
// Catches all errors thrown in route handlers and middleware.
// Sends consistent JSON error responses with appropriate HTTP status codes.

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // If it's our custom AppError, use its status code
  if (err instanceof AppError) {
    log(`[${err.statusCode}] ${err.message}`, err.statusCode >= 500 ? 'error' : 'warn');

    res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Unexpected error — log full stack, return generic 500
  log(`[500] Unexpected: ${err.message}\n${err.stack}`, 'error');

  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      detail: err.message,
      stack: err.stack,
    }),
  });
}
