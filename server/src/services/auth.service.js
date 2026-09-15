import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env, exposeDevOtp } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from '../utils/serializers.js';
import { issueOtp, consumeOtp } from './otp.service.js';
import { sendOtpEmail } from './email.service.js';
import { signAccessToken } from './token.service.js';

const dispatchVerificationCode = async (user) => {
  const { code, expiresAt } = await issueOtp({ userId: user.id });

  const delivery = await sendOtpEmail({
    to: user.email,
    name: user.fullName,
    code,
    expiryMinutes: env.OTP_EXPIRY_MINUTES,
  });

  return {
    email: user.email,
    expiresAt,
    resendAfterSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
    emailDelivered: delivery.delivered,
    ...(exposeDevOtp ? { devOtp: code } : {}),
  };
};

// Signing up again on an unverified email updates the details and resends,
// rather than dead-ending the customer on a duplicate-email error for an
// account they cannot sign into.
export const registerUser = async ({ fullName, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.isEmailVerified) {
    throw AppError.conflict(
      'An account with this email already exists. Please sign in instead.',
      'EMAIL_ALREADY_REGISTERED',
    );
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { fullName, passwordHash },
      })
    : await prisma.user.create({
        data: { fullName, email, passwordHash },
      });

  const verification = await dispatchVerificationCode(user);

  return {
    user: toPublicUser(user),
    verification,
  };
};

export const verifyEmail = async ({ email, code }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw AppError.notFound('No account was found for this email address.', 'USER_NOT_FOUND');
  }

  if (user.isEmailVerified) {
    throw AppError.badRequest(
      'This email address is already verified. Please sign in.',
      'ALREADY_VERIFIED',
    );
  }

  await consumeOtp({ userId: user.id, code });

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true },
  });

  return {
    user: toPublicUser(verifiedUser),
    token: signAccessToken(verifiedUser),
  };
};

export const resendVerificationCode = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw AppError.notFound('No account was found for this email address.', 'USER_NOT_FOUND');
  }

  if (user.isEmailVerified) {
    throw AppError.badRequest(
      'This email address is already verified. Please sign in.',
      'ALREADY_VERIFIED',
    );
  }

  return dispatchVerificationCode(user);
};

// A missing account and a wrong password answer identically, so this endpoint
// cannot be used to discover which addresses are registered.
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  const invalidCredentials = AppError.unauthorized(
    'Incorrect email or password.',
    'INVALID_CREDENTIALS',
  );

  if (!user) {
    // Hash anyway, so a missing account does not answer measurably faster.
    await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    throw invalidCredentials;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw invalidCredentials;
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      403,
      'Please verify your email address before signing in.',
      'EMAIL_NOT_VERIFIED',
      { email: user.email },
    );
  }

  return {
    user: toPublicUser(user),
    token: signAccessToken(user),
  };
};
