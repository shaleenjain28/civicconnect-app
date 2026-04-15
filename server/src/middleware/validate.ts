// ─── Validation Middleware v3 ───

import { type Request, type Response, type NextFunction } from 'express';
import { z, type ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        next(new BadRequestError(`Validation error: ${message}`));
      } else {
        next(err);
      }
    }
  };
}

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  role: z.enum(['citizen', 'municipal', 'supervisor', 'ngo']).default('citizen'),
  departmentId: z.number().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// Issue schemas
export const createIssueSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  departmentId: z.number(),
  scope: z.enum(['local', 'city', 'state', 'country']).default('local'),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  latitude: z.number(),
  longitude: z.number(),
  locationText: z.string().optional(),
  imageUrl: z.string().optional(),
});

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  language: z.enum(['en', 'hi', 'gu']).optional(),
  avatarUrl: z.string().optional(),
});

// Resolution schema
export const resolveIssueSchema = z.object({
  resolutionPhoto: z.string().min(1, 'Resolution photo is required'),
  resolutionNote: z.string().max(1000).optional(),
});

// Verification schema
export const verifyIssueSchema = z.object({
  approved: z.boolean(),
  note: z.string().max(500).optional(),
});

// HOD Update schema
export const updateHodSchema = z.object({
  hodName: z.string().optional(),
  hodEmail: z.string().email().optional(),
  hodPhone: z.string().optional(),
  hodTitle: z.string().optional(),
});
