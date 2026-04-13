// ─── Email Validation Service ───
// Validates emails before signup to prevent Supabase bounce-backs.
// 1. Format validation (regex)
// 2. Disposable email domain blocking
// 3. DNS MX record check (does the domain actually receive email?)

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

// Common disposable/temporary email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.de', 'tempmail.com',
  'throwaway.email', 'temp-mail.org', 'fakeinbox.com', 'sharklasers.com',
  'guerrillamailblock.com', 'grr.la', 'dispostable.com', 'yopmail.com',
  'trashmail.com', 'trashmail.me', 'trashmail.net', 'mailnesia.com',
  'maildrop.cc', 'getairmail.com', 'getnada.com', 'mohmal.com',
  'tempail.com', 'discard.email', 'mailsac.com', 'inboxkitten.com',
  'burnermail.io', '10minutemail.com', 'minutemail.com', 'emailfake.com',
  'crazymailing.com', 'tmail.ws', 'mailcatch.com', 'tempinbox.com',
]);

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export interface EmailValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates an email address:
 * 1. Format check (regex)
 * 2. Disposable domain check
 * 3. MX record check (DNS lookup)
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  // 1. Basic format
  if (!email || !EMAIL_REGEX.test(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return { valid: false, reason: 'Invalid email domain' };
  }

  // 2. Block disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed. Please use a real email.' };
  }

  // 3. DNS MX record check — does this domain actually receive emails?
  try {
    const mxRecords = await resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: `The domain "${domain}" cannot receive emails. Please use a valid email address.` };
    }
  } catch (err: any) {
    // ENOTFOUND = domain doesn't exist, ENODATA = no MX records
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { valid: false, reason: `The email domain "${domain}" does not exist. Please check your email address.` };
    }
    // For other DNS errors (timeout, etc.), allow the request through
    // Better to let Supabase handle it than block legitimate users
    console.warn(`DNS lookup warning for ${domain}:`, err.message);
  }

  return { valid: true };
}

/**
 * Calculate deadline based on criticality.
 * Critical: 24h, High: 3 days, Medium/Low: 7 days
 */
export function calculateDeadline(criticality: string): Date {
  const now = new Date();
  switch (criticality) {
    case 'critical':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    case 'high':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    case 'medium':
    case 'low':
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }
}

/**
 * Calculate urgency score.
 * Higher = more urgent. Accounts for upvotes, category weight, and deadline proximity.
 */
export function calculateUrgencyScore(
  upvoteCount: number,
  criticality: string,
  departmentSlug: string,
  deadline?: Date | null,
): number {
  // Base: upvotes × 10
  let score = upvoteCount * 10;

  // Category weight
  const critWeight: Record<string, number> = {
    critical: 200,
    high: 150,
    medium: 100,
    low: 50,
  };
  score += critWeight[criticality] || 100;

  // Department weight (water/electricity = safety-critical)
  const deptWeight: Record<string, number> = {
    'water-sewerage': 150,
    'electricity-lighting': 150,
    'public-works-roads': 100,
    'sanitation-waste': 100,
    'parks-public-spaces': 80,
  };
  score += deptWeight[departmentSlug] || 100;

  // Deadline penalty
  if (deadline) {
    const now = Date.now();
    const deadlineMs = deadline.getTime();
    const createdEstimate = deadlineMs - 7 * 24 * 60 * 60 * 1000; // estimate creation
    const total = deadlineMs - createdEstimate;
    const elapsed = now - createdEstimate;
    const pct = elapsed / total;

    if (pct > 1.0) score += 200;      // Overdue
    else if (pct > 0.8) score += 100;  // >80% elapsed
    else if (pct > 0.5) score += 50;   // >50% elapsed
  }

  return Math.max(0, Math.round(score));
}
