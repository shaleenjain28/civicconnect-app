// ─── JWT Authentication Middleware ───
// Verifies the Supabase JWT token from the Authorization header.
// Attaches the decoded user payload to req.user for downstream handlers.

import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';
import { prisma } from '../prisma.js';

// Server-side Supabase client (uses anon key — validation happens via getUser())
const supabase = createClient(env.supabase.url, env.supabase.anonKey);

// Extend Express Request type to include our user object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role?: string;
      };
      supabaseToken?: string;
    }
  }
}

/**
 * Required auth — request MUST have a valid JWT.
 * Use on protected routes: router.get('/profile', requireAuth, handler)
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token with Supabase — this checks expiry, signature, etc.
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Prefer DB-backed role/name (more reliable than user_metadata)
    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, email: true, role: true },
    });

    // Attach user info to request for downstream use
    req.user = {
      id: data.user.id,
      email: dbUser?.email || data.user.email || '',
      role: String(dbUser?.role || data.user.user_metadata?.role || 'citizen').toLowerCase(),
    };
    req.supabaseToken = token;

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

/**
 * Optional auth — attaches user if token present, but doesn't block if missing.
 * Use on public routes that optionally benefit from knowing the user.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: data.user.id },
        select: { id: true, email: true, role: true },
      });
      req.user = {
        id: data.user.id,
        email: dbUser?.email || data.user.email || '',
        role: String(dbUser?.role || data.user.user_metadata?.role || 'citizen').toLowerCase(),
      };
      req.supabaseToken = token;
    }
  } catch {
    // Silently continue — user just won't be attached
  }
  next();
}
