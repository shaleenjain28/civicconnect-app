import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

// GET /api/notifications?unread=true
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unread = req.query.unread === 'true';
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.id,
        ...(unread ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.userId !== req.user!.id) throw new NotFoundError('Notification not found');

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;

