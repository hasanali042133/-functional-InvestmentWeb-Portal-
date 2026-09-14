import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse.js';

const handler = (message, code) => (req, res) =>
  sendError(res, { status: 429, message, code });

/** Broad ceiling applied to the whole API. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler('Too many requests. Please slow down.', 'RATE_LIMITED'),
});

/** Tighter limit on credential endpoints to blunt brute-force attempts. */
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

/**
 * OTP endpoints are limited per email address rather than per IP.
 *
 * Keying on the IP would mean one customer fumbling their code could lock out
 * everyone else behind the same office or mobile-carrier NAT. The email address
 * is the actual subject being protected here, and the coarse per-IP ceiling is
 * still enforced by `globalLimiter`.
 *
 * The real controls remain in the OTP service: a resend cooldown and a
 * per-code attempt counter.
 */
export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Runs before validation, so normalise defensively.
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `otp:${email}` : `otp-ip:${req.ip}`;
  },
  handler: handler(
    'Too many verification requests for this email. Please wait a few minutes.',
    'OTP_RATE_LIMITED',
  ),
});
