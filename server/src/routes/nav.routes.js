import crypto from 'node:crypto';
import { Router } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler, sendSuccess } from '../utils/apiResponse.js';
import { advanceNav } from '../services/nav.service.js';

const router = Router();

/**
 * Compares the presented secret without leaking how much of it was right.
 *
 * `timingSafeEqual` throws on a length mismatch, so the lengths are checked
 * first — and the comparison still runs on a padded copy, because bailing out
 * early on length would itself be a signal.
 */
const matchesSecret = (presented) => {
  const expected = env.CRON_SECRET;
  if (!presented || !expected) return false;

  const a = Buffer.from(presented);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);
    return false;
  }

  return crypto.timingSafeEqual(a, b);
};

/**
 * Publishes the next simulated price, for an external scheduler to call.
 *
 * The in-process timer covers a server that stays up. It does not survive a
 * host that runs the API as serverless functions, and it stops on a free
 * instance that sleeps when idle — so prices can also be advanced from outside.
 * A five-minute ping from any scheduler keeps the feed moving, and on a sleeping
 * instance it doubles as the thing that wakes it.
 *
 * With no `CRON_SECRET` configured the route answers 404: an unguarded way to
 * move prices should not exist because somebody forgot to set a variable, and a
 * 403 would confirm the endpoint is there to anyone probing for it.
 */
router.post(
  '/tick',
  asyncHandler(async (req, res) => {
    if (!env.CRON_SECRET) {
      throw AppError.notFound('Not found.', 'NOT_FOUND');
    }

    const header = req.get('authorization') ?? '';
    const presented = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

    if (!matchesSecret(presented)) {
      throw AppError.unauthorized('Invalid scheduler credentials.', 'INVALID_CRON_SECRET');
    }

    // Forced, because a scheduled tick exists precisely to publish a new price
    // — today's row already existing is the normal case, not a reason to stop.
    const { moves } = await advanceNav({ force: true });

    return sendSuccess(res, {
      message: 'Prices advanced.',
      data: { moves },
    });
  }),
);

export default router;
