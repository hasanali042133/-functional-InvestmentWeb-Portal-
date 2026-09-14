import { toNumber } from './money.js';

/**
 * Shapes database rows into API responses.
 *
 * Doing this explicitly (rather than returning Prisma records directly) is what
 * guarantees `passwordHash` can never be leaked by accident, and it converts
 * Prisma `Decimal` values into plain numbers so the frontend does not have to
 * parse money out of strings.
 */

export const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
});

/** Listing view — enough to render a product card. */
export const toProductSummary = (product) => ({
  id: product.id,
  code: product.code,
  name: product.name,
  category: product.category,
  riskLevel: product.riskLevel,
  minInvestment: toNumber(product.minInvestment),
  expectedReturnPct: toNumber(product.expectedReturnPct),
  description: product.description,
  currentNav: toNumber(product.currentNav),
});

/** Detail view — adds the price history and its summary. */
export const toProductDetail = (product) => ({
  ...toProductSummary(product),
  performance: product.performance,
  navHistory: (product.navHistory ?? []).map((point) => ({
    // Date-only column: send `YYYY-MM-DD` rather than a timestamp, so charts
    // are not shifted by the viewer's timezone.
    date: point.date.toISOString().slice(0, 10),
    nav: toNumber(point.nav),
  })),
});
