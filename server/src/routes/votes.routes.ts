// ─── Vote Routes ───
// POST   /api/issues/:id/vote  — Upvote an issue
// DELETE /api/issues/:id/vote  — Remove upvote

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { prisma } from '../prisma.js';

const router = Router();

// ── POST /api/issues/:id/vote ──
router.post('/:id/vote', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = Number(req.params.id);

    // Check issue exists
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundError('Issue not found');

    // Check if already voted
    const existing = await prisma.vote.findUnique({
      where: { userId_issueId: { userId: req.user!.id, issueId } },
    });
    if (existing) throw new ConflictError('You have already upvoted this issue');

    // Create vote + increment counter (atomic-ish via transaction)
    await prisma.$transaction([
      prisma.vote.create({
        data: { userId: req.user!.id, issueId },
      }),
      prisma.issue.update({
        where: { id: issueId },
        data: { upvoteCount: { increment: 1 } },
      }),
    ]);

    res.status(201).json({ message: 'Upvoted successfully', upvoteCount: issue.upvoteCount + 1 });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/issues/:id/vote ──
router.delete('/:id/vote', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = Number(req.params.id);

    const existing = await prisma.vote.findUnique({
      where: { userId_issueId: { userId: req.user!.id, issueId } },
    });
    if (!existing) throw new NotFoundError('You have not upvoted this issue');

    await prisma.$transaction([
      prisma.vote.delete({
        where: { userId_issueId: { userId: req.user!.id, issueId } },
      }),
      prisma.issue.update({
        where: { id: issueId },
        data: { upvoteCount: { decrement: 1 } },
      }),
    ]);

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    res.json({ message: 'Upvote removed', upvoteCount: issue?.upvoteCount || 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
