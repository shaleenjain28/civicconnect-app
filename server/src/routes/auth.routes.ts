// ─── Auth Routes ───
// POST /api/auth/signup    — Create new account
// POST /api/auth/login     — Sign in with email/password
// POST /api/auth/logout    — Sign out
// GET  /api/auth/me        — Get current user info

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { supabase } from '../services/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, signupSchema, loginSchema } from '../middleware/validate.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// ── POST /api/auth/signup ──
router.post('/signup', validateBody(signupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;

    // 1. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }, // Stored in user_metadata
      },
    });

    if (error) throw new BadRequestError(error.message);
    if (!data.user) throw new BadRequestError('Signup failed');

    // 2. Create matching user record in our database
    const user = await prisma.user.create({
      data: {
        id: data.user.id, // Same UUID as Supabase Auth
        email,
        name,
        role,
      },
    });

    log(`New user registered: ${email} (${role})`);

    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new UnauthorizedError('Invalid email or password');
    if (!data.user || !data.session) throw new UnauthorizedError('Login failed');

    // Fetch or create user in our DB
    let user = await prisma.user.findUnique({ where: { id: data.user.id } });

    if (!user) {
      // First time login — create DB record
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'citizen',
        },
      });
    }

    log(`User logged in: ${email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        language: user.language,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ──
router.post('/logout', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await supabase.auth.signOut();
    log(`User logged out: ${req.user?.email}`);
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ──
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) throw new UnauthorizedError('User not found');

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      language: user.language,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
