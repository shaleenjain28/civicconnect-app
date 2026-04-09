// ─── Validation Middleware ───
// Uses Zod schemas to validate request body, query params, and route params.
// Returns 400 with clear error messages if validation fails.

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../utils/errors.js';

/**
 * Creates a middleware that validates req.body against a Zod schema.
 * Usage: router.post('/issues', validateBody(createIssueSchema), handler)
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return next(new BadRequestError(`Validation failed: ${errors.join(', ')}`));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Creates a middleware that validates req.query against a Zod schema.
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return next(new BadRequestError(`Invalid query params: ${errors.join(', ')}`));
    }
    req.query = result.data;
    next();
  };
}

/**
 * Creates a middleware that validates req.params against a Zod schema.
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return next(new BadRequestError(`Invalid params: ${errors.join(', ')}`));
    }
    req.params = result.data;
    next();
  };
}

// ─── Reusable Zod Schemas ───

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50000).default(5000), // meters, default 5km
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createIssueSchema = z.object({
  title: z.string().min(3).max(200).transform((s) => s.trim()),
  description: z.string().min(10).max(2000).transform((s) => s.trim()),
  departmentId: z.number().int().positive(),
  scope: z.enum(['local', 'city', 'state', 'country']).default('local'),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationText: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved']),
});

export const createCommentSchema = z.object({
  body: z.string().min(1).max(1000).transform((s) => s.trim()),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100).transform((s) => s.trim()),
  role: z.enum(['citizen', 'municipal', 'ngo']).default('citizen'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  avatarUrl: z.string().url().optional(),
  language: z.enum(['en', 'hi', 'gu']).optional(),
});
