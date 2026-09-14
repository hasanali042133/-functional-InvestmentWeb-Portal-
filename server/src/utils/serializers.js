/**
 * Shapes database rows into API responses.
 *
 * Doing this explicitly (rather than returning Prisma records directly) is what
 * guarantees `passwordHash` can never be leaked by accident.
 */

export const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});
