// ─── AI Routes ───
// POST /api/ai/analyze-image    — Analyze image → title, description, department, criticality
// POST /api/ai/analyze-text     — Analyze text → department, criticality
// POST /api/ai/draft-complaint  — Generate a formal complaint letter

import { Router, type Request, type Response, type NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { analyzeIssueImage, analyzeIssueText, draftOfficialComplaint } from '../services/gemini.service.js';
import { BadRequestError } from '../utils/errors.js';
import multer from 'multer';

const router = Router();

// Multer config: 5MB max, images only, stored in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only image files are allowed') as unknown as Error);
    }
  },
});

// ── POST /api/ai/analyze-image ──
router.post('/analyze-image', requireAuth, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new BadRequestError('No image file uploaded');

    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const result = await analyzeIssueImage(base64, mimeType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/ai/analyze-text ──
router.post('/analyze-text', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) throw new BadRequestError('Title and description are required');

    const result = await analyzeIssueText(title, description);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/ai/draft-complaint ──
router.post('/draft-complaint', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, department, location, upvotes } = req.body;
    if (!title) throw new BadRequestError('Issue title is required');

    const letter = await draftOfficialComplaint({
      title,
      description: description || '',
      department: department || 'Municipal Corporation',
      location: location || 'Not specified',
      upvotes: upvotes || 0,
    });

    res.json({ letter });
  } catch (err) {
    next(err);
  }
});

export default router;
