import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { toNumber, round } from '../utils/money.js';

/** Ordered lowest risk first, so the listing reads as a risk ladder. */
const RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export const listProducts = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { minInvestment: 'asc' },
  });

  return products.sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
};

/**
 * Summarises the price history into the figures a product detail screen shows.
 *
 * Derived from the stored NAV history rather than hardcoded, so the numbers
 * always agree with the performance chart drawn from the same series.
 */
const summarisePerformance = (navHistory) => {
  if (navHistory.length < 2) return null;

  const first = toNumber(navHistory[0].nav);
  const latest = toNumber(navHistory[navHistory.length - 1].nav);

  const changeOver = (days) => {
    const index = navHistory.length - 1 - days;
    if (index < 0) return null;
    const past = toNumber(navHistory[index].nav);
    return round(((latest - past) / past) * 100, 2);
  };

  const navValues = navHistory.map((point) => toNumber(point.nav));

  return {
    periodDays: navHistory.length,
    startingNav: first,
    currentNav: latest,
    highestNav: round(Math.max(...navValues), 4),
    lowestNav: round(Math.min(...navValues), 4),
    changePct: round(((latest - first) / first) * 100, 2),
    changePct30d: changeOver(30),
    changePct7d: changeOver(7),
  };
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      navHistory: { orderBy: { date: 'asc' } },
    },
  });

  if (!product || !product.isActive) {
    throw AppError.notFound('That investment product is not available.', 'PRODUCT_NOT_FOUND');
  }

  return {
    ...product,
    performance: summarisePerformance(product.navHistory),
  };
};
