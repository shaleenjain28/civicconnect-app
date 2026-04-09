// ─── Supabase Admin Client ───
// Server-side Supabase client used for auth operations.
// For database operations, we use Prisma instead (more type-safe).

import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Public client — used for verifying user tokens
export const supabase = createClient(env.supabase.url, env.supabase.anonKey);

// Admin client — used for operations that need elevated privileges (e.g., listing users)
// Only created if SERVICE_ROLE_KEY is provided
export const supabaseAdmin = env.supabase.serviceRoleKey
  ? createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
