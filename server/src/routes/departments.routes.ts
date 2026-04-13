// ─── Department Routes v3 ───
// Includes HOD info, issue stats, and HOD management

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/departments ──
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { id: 'asc' },
    });

    // Add issue stats per department
    const result = await Promise.all(
      departments.map(async (dept) => {
        const [pending, inProgress, pendingVerification, resolved, escalated] = await Promise.all([
          prisma.issue.count({ where: { departmentId: dept.id, status: 'pending' } }),
          prisma.issue.count({ where: { departmentId: dept.id, status: 'in_progress' } }),
          prisma.issue.count({ where: { departmentId: dept.id, status: 'pending_verification' } }),
          prisma.issue.count({ where: { departmentId: dept.id, status: 'resolved' } }),
          prisma.issue.count({ where: { departmentId: dept.id, escalated: true, status: { notIn: ['resolved'] } } }),
        ]);

        return {
          ...dept,
          totalIssues: dept._count.issues,
          pendingIssues: pending,
          activeIssues: inProgress,
          pendingVerificationIssues: pendingVerification,
          resolvedIssues: resolved,
          escalatedIssues: escalated,
          // Also keep old names for backwards compat
          pendingCount: pending,
          inProgressCount: inProgress,
          pendingVerificationCount: pendingVerification,
          resolvedCount: resolved,
          escalatedCount: escalated,
        };
      })
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/departments/:id ──
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        issues: {
          orderBy: { urgencyScore: 'desc' },
          take: 50,
          include: {
            user: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!dept) throw new NotFoundError('Department not found');
    res.json(dept);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/departments/:id/hod ──
// Get HOD contact info for a department (shown to citizen after they report)
router.get('/:id/hod', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        name: true,
        icon: true,
        hodName: true,
        hodEmail: true,
        hodPhone: true,
        hodTitle: true,
      },
    });

    if (!dept) throw new NotFoundError('Department not found');

    res.json({
      department: dept.name,
      icon: dept.icon,
      hod: {
        name: dept.hodName || 'Not assigned',
        email: dept.hodEmail || null,
        phone: dept.hodPhone || null,
        title: dept.hodTitle || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/departments/:id/hod ──
// Supervisor updates HOD info (admin-managed, HOD can't edit themselves)
router.patch('/:id/hod', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'supervisor') {
      throw new ForbiddenError('Only supervisors can update HOD information');
    }

    const { hodName, hodEmail, hodPhone, hodTitle } = req.body;

    const dept = await prisma.department.update({
      where: { id: Number(req.params.id) },
      data: {
        hodName: hodName || undefined,
        hodEmail: hodEmail || undefined,
        hodPhone: hodPhone || undefined,
        hodTitle: hodTitle || undefined,
      },
    });

    res.json(dept);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/departments/:id/flag-unresponsive ──
// Citizen flags HOD as unresponsive — supervisor can see these
router.post('/:id/flag-unresponsive', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { issueId, reason } = req.body;

    // Add a comment visible to supervisor
    if (issueId) {
      await prisma.comment.create({
        data: {
          issueId: Number(issueId),
          userId: req.user!.id,
          body: `⚠️ HOD Flagged as Unresponsive: ${reason || 'No response from department'}`,
          authorType: 'citizen',
        },
      });
    }

    res.json({ message: 'Flag recorded. Supervisor will be notified.' });
  } catch (err) {
    next(err);
  }
});

export default router;
