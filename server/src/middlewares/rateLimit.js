import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

const handler = (message, code) => (req, res) =>
  sendError(res, { status: 429, message, code });

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many requests. Please slow down.', 'RATE_LIMITED'),
});

// Tighter on credential endpoints, to blunt brute-force attempts.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: handler(
    'Too many attempts. Please try again in a few minutes.',
    'AUTH_RATE_LIMITED',
  ),
});

// Keyed per email rather than per IP: one customer fumbling their code should
// not lock out everyone behind the same office or carrier NAT. The per-IP
// ceiling is still enforced by globalLimiter.
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `otp:${email}` : `otp-ip:${req.ip}`;
  },
  handler: handler(
    'Too many verification requests for this email. Please wait a few minutes.',
    'OTP_RATE_LIMITED',
  ),
});
