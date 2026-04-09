// ─── User Routes ───
// GET   /api/users/me        — Get current user profile
// PATCH /api/users/me        — Update profile
// GET   /api/users/me/stats  — Get user statistics (reports, upvotes, etc.)

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, updateProfileSchema } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/users/me ──
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new NotFoundError('User not found');

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      language: user.language,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/users/me ──
router.patch('/me', requireAuth, validateBody(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
    });

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      language: user.language,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/me/stats ──
router.get('/me/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [totalReports, issuesPending, issuesInProgress, issuesResolved, totalUpvotesReceived] = await Promise.all([
      prisma.issue.count({ where: { userId } }),
      prisma.issue.count({ where: { userId, status: 'pending' } }),
      prisma.issue.count({ where: { userId, status: 'in_progress' } }),
      prisma.issue.count({ where: { userId, status: 'resolved' } }),
      // Sum of upvotes on all user's issues
      prisma.issue.aggregate({
        where: { userId },
        _sum: { upvoteCount: true },
      }),
    ]);

    res.json({
      totalReports,
      totalUpvotesReceived: totalUpvotesReceived._sum.upvoteCount || 0,
      issuesResolved,
      issuesPending,
      issuesInProgress,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
