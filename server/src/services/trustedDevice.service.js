import crypto from 'node:crypto';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

/**
 * Devices a customer has already proved themselves on.
 *
 * Holding one of these lets a sign-in skip the emailed code. It never skips the
 * password: remembering a device is a convenience on the second factor, not a
 * session that survives on its own. Anyone who picks up the browser still has to
 * know the password.
 *
 * The token is long and random rather than guessable, and only its hash is
 * stored — a database read should not hand anybody a working credential. SHA-256
 * rather than bcrypt here because the secret has 256 bits of entropy of its own;
 * there is no dictionary to slow an attacker down against.
 */

const TOKEN_BYTES = 32;

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

/** A short, honest description of the browser, for listing devices later. */
const labelFor = (userAgent = '') => {
  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /OPR\//.test(userAgent) ? 'Opera'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : 'Browser';

  const platform =
    /Windows/.test(userAgent) ? 'Windows'
    : /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Mac OS X/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : null;

  return platform ? `${browser} on ${platform}` : browser;
};

/**
 * Issues a token for this browser and returns it in plain text, once.
 *
 * The expiry is fixed from the moment it is issued rather than sliding with
 * use, so "remembered for seven days" means exactly that and a device cannot
 * quietly stay trusted forever by being used often.
 */
export const rememberDevice = async ({ userId, userAgent }) => {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const expiresAt = new Date(Date.now() + env.TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.trustedDevice.create({
    data: { userId, tokenHash: hash(token), label: labelFor(userAgent), expiresAt },
  });

  return { token, expiresAt };
};

/**
 * True when this token really does belong to this customer and is still good.
 *
 * Scoped to the user rather than looked up on the token alone, so a token issued
 * for one account can never let another one past.
 */
export const isDeviceTrusted = async ({ userId, token }) => {
  if (!token) return false;

  const device = await prisma.trustedDevice.findFirst({
    where: { userId, tokenHash: hash(token), expiresAt: { gt: new Date() } },
    select: { id: true },
  });

  if (!device) return false;

  await prisma.trustedDevice.update({
    where: { id: device.id },
    data: { lastUsedAt: new Date() },
  });

  return true;
};

/**
 * Drops every remembered device for a customer.
 *
 * Called when the password changes: a reset means the account may already be in
 * someone else's hands, and a device trusted before that point should not still
 * be waved through afterwards.
 */
export const forgetAllDevices = (userId) =>
  prisma.trustedDevice.deleteMany({ where: { userId } });

/** Housekeeping for tokens that have simply run out. */
export const pruneExpiredDevices = () =>
  prisma.trustedDevice.deleteMany({ where: { expiresAt: { lt: new Date() } } });
