import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { env, exposeDevOtp } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from '../utils/serializers.js';
import { issueOtp, consumeOtp } from './otp.service.js';
import { sendOtpEmail, sendLoginCodeEmail, sendPasswordResetEmail } from './email.service.js';
import { signAccessToken } from './token.service.js';
import {
  isDeviceTrusted,
  rememberDevice as rememberThisDevice,
  forgetAllDevices,
} from './trustedDevice.service.js';

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

// A missing account and a wrong password answer identically, so nothing here
// can be used to discover which addresses are registered.
const authenticate = async ({ email, password }) => {
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

  if (!(await bcrypt.compare(password, user.passwordHash))) {
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

  return user;
};

/**
 * Step one of signing in: the password is checked, then a code is emailed.
 *
 * The password is required before any code goes out. Sending on an email
 * address alone would let anyone flood a customer's inbox, and would confirm
 * which addresses have accounts.
 */
export const requestLoginCode = async ({ email, password }) => {
  const user = await authenticate({ email, password });
  const { code, expiresAt } = await issueOtp({ userId: user.id, purpose: 'LOGIN' });

  const delivery = await sendLoginCodeEmail({
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

/**
 * Step two: the password is checked again alongside the code.
 *
 * Re-checking it matters — without that, a code intercepted from an inbox would
 * be enough on its own, which is the opposite of what a second factor is for.
 *
 * A browser the customer has already been remembered on may skip the code, but
 * never the password. Remembering a device is a convenience on the second
 * factor; anyone who picks up that browser still has to know the password.
 */
export const loginUser = async ({
  email,
  password,
  code,
  deviceToken,
  rememberDevice = false,
  userAgent,
}) => {
  const user = await authenticate({ email, password });

  const trusted = await isDeviceTrusted({ userId: user.id, token: deviceToken });

  if (!trusted) {
    if (!code) {
      throw AppError.badRequest(
        'Enter the code we emailed you, or request a new one.',
        'LOGIN_CODE_REQUIRED',
      );
    }

    await consumeOtp({ userId: user.id, code, purpose: 'LOGIN' });
  }

  // Only offered once the customer has actually proved themselves with a code,
  // so a stolen password cannot mint its own trusted device.
  const remembered = !trusted && rememberDevice
    ? await rememberThisDevice({ userId: user.id, userAgent })
    : null;

  return {
    user: toPublicUser(user),
    token: signAccessToken(user),
    usedTrustedDevice: trusted,
    ...(remembered
      ? { device: { token: remembered.token, expiresAt: remembered.expiresAt } }
      : {}),
  };
};

/**
 * Starts a password reset.
 *
 * Always answers the same way, whether or not the address has an account. A
 * reset form that says "no such account" is a list of everybody who banks here,
 * free to anyone who asks.
 */
export const requestPasswordReset = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  const answer = {
    email,
    resendAfterSeconds: env.OTP_RESEND_COOLDOWN_SECONDS,
  };

  if (!user || !user.isEmailVerified) return answer;

  // A cooldown breach must not leak either: the caller gets the same answer as
  // an address with no account at all.
  try {
    const { code, expiresAt } = await issueOtp({ userId: user.id, purpose: 'PASSWORD_RESET' });

    const delivery = await sendPasswordResetEmail({
      to: user.email,
      name: user.fullName,
      code,
      expiryMinutes: env.OTP_EXPIRY_MINUTES,
    });

    return {
      ...answer,
      expiresAt,
      emailDelivered: delivery.delivered,
      ...(exposeDevOtp ? { devOtp: code } : {}),
    };
  } catch (error) {
    if (error.code === 'OTP_COOLDOWN') return answer;
    throw error;
  }
};

/** Finishes a reset: the code authorises choosing a new password. */
export const resetPassword = async ({ email, code, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Reaching here means a code was quoted for an address with no account,
    // which cannot happen for a code this service issued.
    throw AppError.badRequest(
      'That reset code is not valid. Please request a new one.',
      'OTP_INVALID',
    );
  }

  await consumeOtp({ userId: user.id, code, purpose: 'PASSWORD_RESET' });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS),
      // Somebody who resets a password has proved they hold the inbox, which is
      // the same proof signup asks for.
      isEmailVerified: true,
    },
  });

  // Every remembered browser is dropped: a reset means the account may already
  // be in someone else's hands, and a device trusted before that point should
  // not still be waved through afterwards.
  await forgetAllDevices(user.id);

  return {
    user: toPublicUser(updated),
    token: signAccessToken(updated),
  };
};
