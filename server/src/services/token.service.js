import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'investment-portal';

// The payload carries only the user id; everything else is read from the
// database per request, so a token cannot carry stale authorisation.
export const signAccessToken = (user) =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: ISSUER,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_SECRET, { issuer: ISSUER });
