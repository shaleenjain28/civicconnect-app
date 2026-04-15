// ─── Auth Routes v3 ───
// Uses Supabase public client for signup/login (no service role key needed)

import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabase } from '../services/supabaseAdmin.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, signupSchema, loginSchema } from '../middleware/validate.js';
import { validateEmail } from '../services/email.service.js';
import { BadRequestError, UnauthorizedError } from '../utils/errors.js';
import { prisma } from '../prisma.js';

const router = Router();

// ── POST /api/auth/signup ──
router.post('/signup', validateBody(signupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role = 'citizen', departmentId } = req.body;

    // ─── Email validation (prevents Supabase bounce) ───
    const emailCheck = await validateEmail(email);
    if (!emailCheck.valid) {
      throw new BadRequestError(emailCheck.reason || 'Invalid email address');
    }

    // Municipal users must specify a department
    if (role === 'municipal' && !departmentId) {
      throw new BadRequestError('Municipal users must select a department');
    }

    // Create user in Supabase Auth using public client
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (error) throw new BadRequestError(error.message);
    if (!data.user) throw new BadRequestError('Signup failed. Please try again.');

    // Create user in our DB
    const dbUser = await prisma.user.upsert({
      where: { id: data.user.id },
      update: { name, role: String(role).toLowerCase(), departmentId: role === 'municipal' ? departmentId : null },
      create: {
        id: data.user.id,
        email,
        name,
        role: String(role).toLowerCase(),
        departmentId: role === 'municipal' ? departmentId : null,
      },
    });

    res.status(201).json({
      user: dbUser,
      session: data.session,
      message: data.session ? 'Account created and signed in' : 'Account created. Please check your email to confirm.',
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new UnauthorizedError('Invalid email or password');

    // Get or create DB user (check by ID first, then by email)
    let dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { department: true },
    });

    if (!dbUser) {
      // User might exist with a different Supabase ID (e.g., re-created in Supabase)
      // Use upsert on email to handle gracefully
      const name = data.user.user_metadata?.name || email.split('@')[0];
      const role = String(data.user.user_metadata?.role || 'citizen').toLowerCase();

      dbUser = await prisma.user.upsert({
        where: { email: data.user.email! },
        update: {
          id: data.user.id, // Sync the Supabase ID
          name: name,
          role: role,
        },
        create: {
          id: data.user.id,
          email: data.user.email!,
          name,
          role,
        },
        include: { department: true },
      });
    }

    res.json({
      user: {
        ...dbUser,
        departmentName: (dbUser as any).department?.name || null,
      },
      session: data.session,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ──
router.post('/logout', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
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
      include: { department: true },
    });

    if (!user) throw new UnauthorizedError('User not found');

    res.json({
      ...user,
      departmentName: (user as any).department?.name || null,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/validate-email ──
router.post('/validate-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new BadRequestError('Email is required');

    const result = await validateEmail(email);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
