import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/apiResponse.js';
import { verifyAccessToken } from '../services/token.service.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization ?? '';

  if (!header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Please sign in to continue.', 'MISSING_TOKEN');
  }

  const token = header.slice(7).trim();
  if (!token) {
    throw AppError.unauthorized('Please sign in to continue.', 'MISSING_TOKEN');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    const expired = error?.name === 'TokenExpiredError';
    throw AppError.unauthorized(
      expired
        ? 'Your session has expired. Please sign in again.'
        : 'Your session is not valid. Please sign in again.',
      expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    );
  }

  // Read fresh rather than trusting the token payload, so a deleted or
  // de-verified account stops working immediately.
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, fullName: true, email: true, isEmailVerified: true, createdAt: true },
  });

  if (!user) {
    throw AppError.unauthorized('Your account no longer exists.', 'USER_NOT_FOUND');
  }

  if (!user.isEmailVerified) {
    throw AppError.forbidden('Please verify your email address first.', 'EMAIL_NOT_VERIFIED');
  }

  req.user = user;
  return next();
});
