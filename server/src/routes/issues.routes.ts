// ─── Issues Routes v3 ───
// Full CRUD with deadlines, urgency scores, resolution verification, HOD assignment

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { calculateDeadline, calculateUrgencyScore } from '../services/email.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

const router = Router();
const prisma = new PrismaClient();

// ── GET /api/issues ──
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department, status, criticality, sort, limit = '50', offset = '0', escalated } = req.query;

    const where: any = {};
    if (department) where.departmentId = Number(department);
    if (status) where.status = status;
    if (criticality) where.criticality = criticality;
    if (escalated === 'true') where.escalated = true;

    const orderBy: any = sort === 'urgency'
      ? { urgencyScore: 'desc' }
      : sort === 'upvotes'
        ? { upvoteCount: 'desc' }
        : { createdAt: 'desc' };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
        include: {
          department: true,
          user: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    // Check if any issues are overdue and mark escalated
    const now = new Date();
    for (const issue of issues) {
      if (issue.deadline && issue.deadline < now && !issue.escalated &&
          issue.status !== 'resolved' && issue.status !== 'pending_verification') {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { escalated: true },
        });
        (issue as any).escalated = true;
      }
    }

    res.json({ data: issues, total, limit: Number(limit), offset: Number(offset) });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/nearby ──
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lon, radius = '5000', limit = '50' } = req.query;
    if (!lat || !lon) throw new BadRequestError('lat and lon are required');

    const userLat = Number(lat);
    const userLon = Number(lon);
    const maxRadius = Number(radius);

    const issues = await prisma.issue.findMany({
      where: { status: { not: 'resolved' } },
      include: {
        department: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { urgencyScore: 'desc' },
      take: Math.min(Number(limit), 100),
    });

    // Haversine filter
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const filtered = issues
      .map((issue) => {
        const dLat = toRad(issue.latitude - userLat);
        const dLon = toRad(issue.longitude - userLon);
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(userLat)) * Math.cos(toRad(issue.latitude)) * Math.sin(dLon / 2) ** 2;
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...issue, distance_meters: Math.round(distance) };
      })
      .filter((issue) => issue.distance_meters <= maxRadius)
      .sort((a, b) => b.urgencyScore - a.urgencyScore);

    res.json({ data: filtered });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/escalated ──
router.get('/escalated', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await prisma.issue.findMany({
      where: {
        escalated: true,
        status: { notIn: ['resolved'] },
      },
      include: {
        department: true,
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { urgencyScore: 'desc' },
    });

    res.json({ data: issues, total: issues.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/:id ──
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        department: true,
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true } },
        comments: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!issue) throw new NotFoundError('Issue not found');
    res.json(issue);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/issues ──
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, departmentId, latitude, longitude, locationText, imageUrl, criticality = 'medium', scope = 'local' } = req.body;

    if (!title || !description || !departmentId || latitude === undefined || longitude === undefined) {
      throw new BadRequestError('title, description, departmentId, latitude, longitude are required');
    }

    // Get department for urgency calculation
    const dept = await prisma.department.findUnique({ where: { id: Number(departmentId) } });
    if (!dept) throw new NotFoundError('Department not found');

    const deadline = calculateDeadline(criticality);
    const urgencyScore = calculateUrgencyScore(0, criticality, dept.slug, deadline);

    const issue = await prisma.issue.create({
      data: {
        userId: req.user!.id,
        title,
        description,
        departmentId: Number(departmentId),
        scope,
        criticality,
        latitude: Number(latitude),
        longitude: Number(longitude),
        locationText: locationText || null,
        imageUrl: imageUrl || null,
        deadline,
        urgencyScore,
      },
      include: { department: true },
    });

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/issues/:id/status ──
router.patch('/:id/status', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, note } = req.body;
    if (!status) throw new BadRequestError('status is required');

    const issue = await prisma.issue.findUnique({ where: { id: Number(req.params.id) } });
    if (!issue) throw new NotFoundError('Issue not found');

    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
        assignedToId: status === 'in_progress' ? req.user!.id : undefined,
      },
    });

    await prisma.statusHistory.create({
      data: {
        issueId: issue.id,
        oldStatus: issue.status,
        newStatus: status,
        changedBy: req.user!.id,
        note: note || null,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/issues/:id/resolve ──
// Municipal uploads resolution photo + note
router.patch('/:id/resolve', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolutionPhoto, resolutionNote } = req.body;
    if (!resolutionPhoto) throw new BadRequestError('Resolution photo is required for verification');

    const issue = await prisma.issue.findUnique({ where: { id: Number(req.params.id) } });
    if (!issue) throw new NotFoundError('Issue not found');

    // Mark as pending verification
    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: {
        status: 'pending_verification',
        resolutionPhoto,
        resolutionNote: resolutionNote || null,
        assignedToId: req.user!.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        issueId: issue.id,
        oldStatus: issue.status,
        newStatus: 'pending_verification',
        changedBy: req.user!.id,
        note: resolutionNote || 'Resolution submitted for verification',
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/issues/:id/verify ──
// Supervisor or citizen verifies resolution
router.patch('/:id/verify', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { approved, note } = req.body;
    const issue = await prisma.issue.findUnique({ where: { id: Number(req.params.id) } });
    if (!issue) throw new NotFoundError('Issue not found');

    if (issue.status !== 'pending_verification') {
      throw new BadRequestError('Issue is not pending verification');
    }

    // Only supervisor, original reporter, or authority can verify
    const userRole = req.user!.role;
    if (userRole !== 'supervisor' && issue.userId !== req.user!.id) {
      throw new ForbiddenError('Only supervisor or original reporter can verify');
    }

    if (approved) {
      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: {
          status: 'resolved',
          verifiedById: req.user!.id,
          verifiedAt: new Date(),
          resolvedAt: new Date(),
        },
      });

      await prisma.statusHistory.create({
        data: {
          issueId: issue.id,
          oldStatus: 'pending_verification',
          newStatus: 'resolved',
          changedBy: req.user!.id,
          note: note || 'Resolution verified ✅',
        },
      });

      res.json(updated);
    } else {
      // Rejected — reopen issue
      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: {
          status: 'in_progress',
          resolutionPhoto: null,
          resolutionNote: null,
          verifiedById: null,
          verifiedAt: null,
        },
      });

      await prisma.statusHistory.create({
        data: {
          issueId: issue.id,
          oldStatus: 'pending_verification',
          newStatus: 'in_progress',
          changedBy: req.user!.id,
          note: note || 'Resolution rejected — issue reopened',
        },
      });

      res.json(updated);
    }
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/issues/:id/reassign ──
// Supervisor reassigns issue to different department
router.patch('/:id/reassign', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'supervisor') {
      throw new ForbiddenError('Only supervisors can reassign issues');
    }

    const { departmentId, note } = req.body;
    if (!departmentId) throw new BadRequestError('departmentId is required');

    const issue = await prisma.issue.findUnique({
      where: { id: Number(req.params.id) },
      include: { department: true },
    });
    if (!issue) throw new NotFoundError('Issue not found');

    const newDept = await prisma.department.findUnique({ where: { id: Number(departmentId) } });
    if (!newDept) throw new NotFoundError('Department not found');

    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: { departmentId: Number(departmentId) },
      include: { department: true },
    });

    await prisma.statusHistory.create({
      data: {
        issueId: issue.id,
        oldStatus: issue.status,
        newStatus: issue.status,
        changedBy: req.user!.id,
        note: note || `Reassigned from ${issue.department.name} to ${newDept.name}`,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
