import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/** Cryptographically random numeric code, zero-padded to the configured length. */
const generateCode = () => {
  const max = 10 ** env.OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(env.OTP_LENGTH, '0');
};

/**
 * Issues a fresh OTP for a user.
 *
 * - Codes are stored hashed, never in plain text, so a database read cannot be
 *   replayed to take over an account.
 * - Any previous unused code for the same purpose is discarded, so only the
 *   most recent code is ever valid.
 * - A per-user cooldown prevents mailbox flooding via the resend endpoint.
 *
 * @returns {Promise<{ code: string, expiresAt: Date }>} the plain code, for emailing only
 */
export const issueOtp = async ({ userId, purpose = 'EMAIL_VERIFICATION' }) => {
  const latest = await prisma.otp.findFirst({
    where: { userId, purpose },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (latest) {
    const elapsedSeconds = (Date.now() - latest.createdAt.getTime()) / 1000;
    const remaining = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);

    if (remaining > 0) {
      throw AppError.tooManyRequests(
        `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before requesting another code.`,
        'OTP_COOLDOWN',
        { retryAfterSeconds: remaining },
      );
    }
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, env.BCRYPT_SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.$transaction([
    prisma.otp.deleteMany({ where: { userId, purpose, consumedAt: null } }),
    prisma.otp.create({ data: { userId, purpose, codeHash, expiresAt } }),
  ]);

  return { code, expiresAt };
};

/**
 * Checks a submitted code and consumes it on success.
 *
 * Failed attempts are counted so a 6-digit code cannot be brute-forced within
 * its validity window.
 */
export const consumeOtp = async ({ userId, code, purpose = 'EMAIL_VERIFICATION' }) => {
  const otp = await prisma.otp.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw AppError.badRequest(
      'No active verification code was found. Please request a new one.',
      'OTP_NOT_FOUND',
    );
  }

  if (otp.expiresAt.getTime() <= Date.now()) {
    throw AppError.badRequest(
      'This verification code has expired. Please request a new one.',
      'OTP_EXPIRED',
    );
  }

  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw AppError.tooManyRequests(
      'Too many incorrect attempts. Please request a new code.',
      'OTP_MAX_ATTEMPTS',
    );
  }

  const matches = await bcrypt.compare(code, otp.codeHash);

  if (!matches) {
    const { attempts } = await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });

    const attemptsRemaining = Math.max(env.OTP_MAX_ATTEMPTS - attempts, 0);

    throw AppError.badRequest(
      attemptsRemaining > 0
        ? `That code is incorrect. You have ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} left.`
        : 'That code is incorrect. Please request a new code.',
      'OTP_INVALID',
      { attemptsRemaining },
    );
  }

  await prisma.otp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return true;
};

/** Removes expired / already-used codes. Safe to call periodically. */
export const purgeStaleOtps = () =>
  prisma.otp.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }],
    },
  });
