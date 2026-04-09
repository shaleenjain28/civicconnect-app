import morgan from 'morgan';
import { env } from '../config/env.js';

// Use 'dev' format in development (colored, concise), 'combined' in production (Apache-style, good for log aggregation)
export const httpLogger = morgan(env.nodeEnv === 'production' ? 'combined' : 'dev');

export function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}
