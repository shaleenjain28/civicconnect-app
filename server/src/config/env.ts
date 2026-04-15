import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),

  GEMINI_API_KEY: z.string().min(1),

  // Some deploy configs use CORS_ORIGIN (single) vs CORS_ORIGINS (csv)
  CORS_ORIGINS: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),

  JWT_SECRET: z.string().optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return {
    port: parseInt(parsed.data.PORT, 10),
    nodeEnv: parsed.data.NODE_ENV,
    supabase: {
      url: parsed.data.SUPABASE_URL,
      anonKey: parsed.data.SUPABASE_ANON_KEY,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY || '',
    },
    databaseUrl: parsed.data.DATABASE_URL || '',
    geminiApiKey: parsed.data.GEMINI_API_KEY,
    corsOrigins: (parsed.data.CORS_ORIGINS || parsed.data.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    jwtSecret: parsed.data.JWT_SECRET || '',
  };
}

export const env = loadEnv();
export type Env = ReturnType<typeof loadEnv>;
