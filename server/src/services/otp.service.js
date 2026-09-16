import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const generateCode = () =>
  String(crypto.randomInt(0, 10 ** env.OTP_LENGTH)).padStart(env.OTP_LENGTH, '0');

/**
 * Issues a code and returns it in plain text, for emailing only. What is stored
 * is a hash, so a database read cannot be replayed to take over an account.
 */
export const issueOtp = async ({ userId, purpose = 'EMAIL_VERIFICATION' }) => {
  // The cooldown exists to stop an inbox being flooded, which only happens when
  // codes are requested and never used. A code that has been consumed is spent,
  // so asking for the next one is a new act, not a repeat — otherwise signing
  // out and back in inside a minute would be impossible.
  const latest = await prisma.otp.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (latest) {
    const elapsed = (Date.now() - latest.createdAt.getTime()) / 1000;
    const remaining = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - elapsed);

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

  // Discarding earlier codes keeps exactly one valid at a time.
  await prisma.$transaction([
    prisma.otp.deleteMany({ where: { userId, purpose, consumedAt: null } }),
    prisma.otp.create({ data: { userId, purpose, codeHash, expiresAt } }),
  ]);

  return { code, expiresAt };
};

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

  if (!(await bcrypt.compare(code, otp.codeHash))) {
    // Counting attempts is what stops a six-digit code being brute-forced
    // inside its validity window.
    const { attempts } = await prisma.otp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });

    const left = Math.max(env.OTP_MAX_ATTEMPTS - attempts, 0);

    throw AppError.badRequest(
      left > 0
        ? `That code is incorrect. You have ${left} attempt${left === 1 ? '' : 's'} left.`
        : 'That code is incorrect. Please request a new code.',
      'OTP_INVALID',
      { attemptsRemaining: left },
    );
  }

  await prisma.otp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  return true;
};

export const purgeStaleOtps = () =>
  prisma.otp.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { consumedAt: { not: null } }] },
  });
