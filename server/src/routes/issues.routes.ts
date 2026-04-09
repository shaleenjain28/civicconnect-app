// ─── Issue Routes ───
// GET    /api/issues           — List all issues (paginated, filterable)
// GET    /api/issues/nearby    — Get issues within radius of coordinates
// GET    /api/issues/:id       — Get single issue with details
// POST   /api/issues           — Create new issue
// PATCH  /api/issues/:id/status — Update issue status (municipal/ngo only)

import { Router, type Request, type Response, type NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import {
  validateBody, validateQuery, validateParams,
  createIssueSchema, updateStatusSchema, idParamSchema, nearbyQuerySchema, paginationSchema,
} from '../middleware/validate.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';
import { buildNearbyWhereClause, buildDistanceOrderClause, reverseGeocode } from '../services/geo.service.js';
import { log } from '../utils/logger.js';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Query schema for listing issues with filters
const listQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
  department: z.coerce.number().int().positive().optional(),
  scope: z.string().optional(),
  criticality: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'most_voted']).default('newest'),
});

// ── GET /api/issues ──
router.get('/', optionalAuth, validateQuery(listQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, department, scope, criticality, search, sort } = req.query as z.infer<typeof listQuerySchema>;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (department) where.departmentId = department;
    if (scope) where.scope = scope;
    if (criticality) where.criticality = criticality;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sort === 'most_voted'
      ? { upvoteCount: 'desc' as const }
      : sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          department: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { comments: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.issue.count({ where }),
    ]);

    // If user is authenticated, check which issues they've upvoted
    let userVotes: Set<number> = new Set();
    if (req.user) {
      const votes = await prisma.vote.findMany({
        where: { userId: req.user.id, issueId: { in: issues.map((i) => i.id) } },
        select: { issueId: true },
      });
      userVotes = new Set(votes.map((v) => v.issueId));
    }

    res.json({
      data: issues.map((issue) => ({
        ...issue,
        hasVoted: userVotes.has(issue.id),
        commentCount: issue._count.comments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/nearby ──
router.get('/nearby', optionalAuth, validateQuery(nearbyQuerySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lon, radius, page, limit } = req.query as z.infer<typeof nearbyQuerySchema>;

    const whereClause = buildNearbyWhereClause(lat, lon, radius);
    const distanceOrder = buildDistanceOrderClause(lat, lon);

    // Raw SQL for geo query (Prisma doesn't natively support spatial queries)
    const issues = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(`
      SELECT i.*, d.name as department_name, d.slug as department_slug,
             d.icon as department_icon, d.color as department_color,
             u.name as reporter_name, u.avatar_url as reporter_avatar,
             ${distanceOrder} as distance_meters
      FROM issues i
      JOIN departments d ON i.department_id = d.id
      JOIN users u ON i.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${distanceOrder} ASC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `);

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count FROM issues WHERE ${whereClause}
    `);
    const total = Number(countResult[0]?.count || 0);

    res.json({
      data: issues,
      center: { lat, lon },
      radius,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/:id ──
router.get('/:id', optionalAuth, validateParams(idParamSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as { id: number };

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        department: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatarUrl: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        statusHistory: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { changedAt: 'asc' },
        },
        _count: { select: { votes: true, comments: true } },
      },
    });

    if (!issue) throw new NotFoundError('Issue not found');

    // Check if current user has voted
    let hasVoted = false;
    if (req.user) {
      const vote = await prisma.vote.findUnique({
        where: { userId_issueId: { userId: req.user.id, issueId: id } },
      });
      hasVoted = !!vote;
    }

    res.json({ ...issue, hasVoted });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/issues ──
router.post('/', requireAuth, validateBody(createIssueSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Reverse geocode if no location text provided
    if (!data.locationText) {
      data.locationText = await reverseGeocode(data.latitude, data.longitude);
    }

    const issue = await prisma.issue.create({
      data: {
        userId: req.user!.id,
        title: data.title,
        description: data.description,
        departmentId: data.departmentId,
        scope: data.scope,
        criticality: data.criticality,
        latitude: data.latitude,
        longitude: data.longitude,
        locationText: data.locationText,
        imageUrl: data.imageUrl,
      },
      include: {
        department: true,
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    log(`New issue created: "${issue.title}" by ${req.user!.email} → ${issue.department.name} [${issue.criticality}]`);

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/issues/:id/status ──
router.patch('/:id/status', requireAuth, validateParams(idParamSchema), validateBody(updateStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const { status } = req.body;

    // Only municipal/ngo can change status
    if (req.user!.role !== 'municipal' && req.user!.role !== 'ngo') {
      throw new ForbiddenError('Only municipal staff or NGO members can update issue status');
    }

    const issue = await prisma.issue.findUnique({ where: { id } });
    if (!issue) throw new NotFoundError('Issue not found');

    const oldStatus = issue.status;

    // Update status + resolved timestamp
    const updated = await prisma.issue.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : null,
      },
      include: { department: true },
    });

    // Record status change in history
    await prisma.statusHistory.create({
      data: {
        issueId: id,
        oldStatus,
        newStatus: status,
        changedBy: req.user!.id,
      },
    });

    log(`Issue #${id} status: ${oldStatus} → ${status} by ${req.user!.email}`);

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
