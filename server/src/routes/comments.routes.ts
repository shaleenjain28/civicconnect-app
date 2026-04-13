// ─── Comment Routes ───
// GET  /api/issues/:id/comments — Get comments for an issue
// POST /api/issues/:id/comments — Add a comment

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/issues/:id/comments ──
router.get('/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = Number(req.params.id);

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundError('Issue not found');

    const comments = await prisma.comment.findMany({
      where: { issueId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/issues/:id/comments ──
router.post('/:id/comments', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = Number(req.params.id);
    const { body } = req.body;
    if (!body || body.trim().length === 0) return res.status(400).json({ error: 'Comment body is required' });

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) throw new NotFoundError('Issue not found');

    const authorType = req.user!.role === 'municipal' || req.user!.role === 'supervisor' || req.user!.role === 'ngo' ? 'authority' : 'citizen';

    const comment = await prisma.comment.create({
      data: {
        issueId,
        userId: req.user!.id,
        body,
        authorType,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

export default router;
