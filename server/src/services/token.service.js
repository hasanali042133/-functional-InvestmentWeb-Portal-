import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'investment-portal';

/**
 * Signs a short-lived access token. The payload carries only the user id —
 * anything else (name, verification status) is read fresh from the database on
 * each request so a stale token cannot carry stale authorisation.
 */
export const signAccessToken = (user) =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: ISSUER,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER });
