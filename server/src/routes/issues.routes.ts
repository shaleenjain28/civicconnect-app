// ─── Issues Routes v3 ───
// Full CRUD with deadlines, urgency scores, resolution verification, HOD assignment

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { calculateDeadline, calculateUrgencyScore } from '../services/email.service.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../prisma.js';

const router = Router();

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

    // Mark overdue issues escalated (batch update to avoid per-row writes)
    const now = new Date();
    const overdueIds = issues
      .filter(
        (issue) =>
          issue.deadline &&
          issue.deadline < now &&
          !issue.escalated &&
          issue.status !== 'resolved' &&
          issue.status !== 'pending_verification' &&
          issue.status !== 'pending_user_verification'
      )
      .map((i) => i.id);

    if (overdueIds.length) {
      await prisma.issue.updateMany({
        where: { id: { in: overdueIds } },
        data: { escalated: true },
      });
      for (const issue of issues) {
        if (overdueIds.includes(issue.id)) (issue as any).escalated = true;
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

    // Bounding-box prefilter in DB to avoid scanning all issues.
    // 1 degree latitude ~ 111,320 meters.
    const metersPerDegreeLat = 111_320;
    const deltaLat = maxRadius / metersPerDegreeLat;
    const cosLat = Math.cos((userLat * Math.PI) / 180) || 0.000001;
    const deltaLon = maxRadius / (metersPerDegreeLat * cosLat);

    const issues = await prisma.issue.findMany({
      where: {
        status: { not: 'resolved' },
        latitude: { gte: userLat - deltaLat, lte: userLat + deltaLat },
        longitude: { gte: userLon - deltaLon, lte: userLon + deltaLon },
      },
      include: {
        department: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { urgencyScore: 'desc' },
      // Grab a small superset; final radius filter happens below.
      take: Math.min(Math.max(Number(limit) * 5, 100), 500),
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
      .sort((a, b) => b.urgencyScore - a.urgencyScore)
      .slice(0, Math.min(Number(limit), 100));

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

    // Permission: only municipal/supervisor can change workflow status
    const role = String(req.user?.role || 'citizen').toLowerCase();
    if (role !== 'municipal' && role !== 'supervisor') {
      throw new ForbiddenError('Only municipal staff or supervisors can change issue status');
    }

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

    // Permission: only municipal/supervisor can submit resolution
    const role = String(req.user?.role || 'citizen').toLowerCase();
    if (role !== 'municipal' && role !== 'supervisor') {
      throw new ForbiddenError('Only municipal staff or supervisors can submit resolutions');
    }

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

    const userRole = String(req.user!.role || 'citizen').toLowerCase();
    const isSupervisor = userRole === 'supervisor';

    // Stage 1 verification (supervisor): only supervisor can approve/reject
    if (!isSupervisor) {
      throw new ForbiddenError('Only supervisors can verify a submitted resolution');
    }

    if (approved) {
      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: {
          // Supervisor verified: now waiting for citizen confirmation
          status: 'pending_user_verification',
          verifiedById: req.user!.id,
          verifiedAt: new Date(),
        },
      });

      await prisma.statusHistory.create({
        data: {
          issueId: issue.id,
          oldStatus: 'pending_verification',
          newStatus: 'pending_user_verification',
          changedBy: req.user!.id,
          note: note || 'Resolution verified by supervisor — awaiting citizen confirmation',
        },
      });

      // Notify reporter + upvoters
      const upvoters = await prisma.vote.findMany({
        where: { issueId: issue.id },
        select: { userId: true },
      });
      const recipients = Array.from(new Set([issue.userId, ...upvoters.map((v) => v.userId)]));
      await prisma.notification.createMany({
        data: recipients.map((userId) => ({
          userId,
          issueId: issue.id,
          type: 'verification_required',
          title: 'Issue resolution needs confirmation',
          body: `A supervisor verified the resolution for “${issue.title}”. Please confirm if it’s resolved.`,
        })),
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

// ── PATCH /api/issues/:id/confirm ──
// Citizen reporter (or any upvoter) confirms the supervisor-verified resolution
router.patch('/:id/confirm', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { approved, note } = req.body || {};
    if (typeof approved !== 'boolean') throw new BadRequestError('approved is required');

    const issue = await prisma.issue.findUnique({
      where: { id: Number(req.params.id) },
      include: { votes: { select: { userId: true } } },
    });
    if (!issue) throw new NotFoundError('Issue not found');

    if (issue.status !== 'pending_user_verification') {
      throw new BadRequestError('Issue is not pending user verification');
    }

    const userId = req.user!.id;
    const isReporter = issue.userId === userId;
    const isUpvoter = issue.votes.some((v) => v.userId === userId);
    if (!isReporter && !isUpvoter) {
      throw new ForbiddenError('Only the reporter or an upvoter can confirm resolution');
    }

    if (approved) {
      const updated = await prisma.issue.update({
        where: { id: issue.id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
      });

      await prisma.statusHistory.create({
        data: {
          issueId: issue.id,
          oldStatus: 'pending_user_verification',
          newStatus: 'resolved',
          changedBy: userId,
          note: note || 'Resolution confirmed by citizen ✅',
        },
      });

      // Notify reporter + upvoters about closure
      const recipients = Array.from(new Set([issue.userId, ...issue.votes.map((v) => v.userId)]));
      await prisma.notification.createMany({
        data: recipients.map((uid) => ({
          userId: uid,
          issueId: issue.id,
          type: 'issue_update',
          title: 'Issue closed',
          body: `“${issue.title}” has been confirmed resolved and closed.`,
        })),
      });

      res.json(updated);
    } else {
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
          oldStatus: 'pending_user_verification',
          newStatus: 'in_progress',
          changedBy: userId,
          note: note || 'Citizen rejected resolution — issue reopened',
        },
      });

      // Notify assignee/reporter that it was rejected (best-effort)
      const recipients = Array.from(new Set([issue.userId, ...(issue.assignedToId ? [issue.assignedToId] : [])]));
      if (recipients.length) {
        await prisma.notification.createMany({
          data: recipients.map((uid) => ({
            userId: uid,
            issueId: issue.id,
            type: 'issue_update',
            title: 'Resolution rejected',
            body: `“${issue.title}” was rejected during confirmation and has been reopened.`,
          })),
        });
      }

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
    if (String(req.user!.role || '').toLowerCase() !== 'supervisor') {
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
