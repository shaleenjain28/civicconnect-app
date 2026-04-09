// ─── Department Routes ───
// GET /api/departments          — List all departments with issue counts
// GET /api/departments/:id      — Get department details with its issues

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateParams, idParamSchema } from '../middleware/validate.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/departments ──
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { issues: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Also get counts by status for each department
    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const [pending, inProgress, resolved] = await Promise.all([
          prisma.issue.count({ where: { departmentId: dept.id, status: 'pending' } }),
          prisma.issue.count({ where: { departmentId: dept.id, status: 'in_progress' } }),
          prisma.issue.count({ where: { departmentId: dept.id, status: 'resolved' } }),
        ]);

        return {
          ...dept,
          totalIssues: dept._count.issues,
          pendingCount: pending,
          inProgressCount: inProgress,
          resolvedCount: resolved,
        };
      })
    );

    res.json(deptStats);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/departments/:id ──
router.get('/:id', validateParams(idParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as { id: number };

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        issues: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { comments: true, votes: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { issues: true } },
      },
    });

    if (!department) throw new NotFoundError('Department not found');

    res.json(department);
  } catch (err) {
    next(err);
  }
});

export default router;
