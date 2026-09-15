import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { toNumber, round } from '../utils/money.js';
import { getTicks } from './nav.service.js';

// Lowest risk first, so the listing reads as a risk ladder.
const RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export const listProducts = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { minInvestment: 'asc' },
  });

  return products.sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
};

// Derived from the stored series rather than hardcoded, so these figures cannot
// disagree with the chart drawn from the same data.
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

/**
 * The same shape as the daily summary, over the intraday feed.
 *
 * Deliberately measured from the first tick in the window rather than from the
 * previous day's close: the window is a rolling 24 hours, so "since the start of
 * the window" is the only span these numbers can honestly describe.
 */
const summariseIntraday = (ticks) => {
  if (ticks.length < 2) return null;

  const navs = ticks.map((tick) => toNumber(tick.nav));
  const first = navs[0];
  const latest = navs[navs.length - 1];

  return {
    points: ticks.length,
    from: ticks[0].recordedAt,
    to: ticks[ticks.length - 1].recordedAt,
    openingNav: first,
    currentNav: latest,
    highestNav: round(Math.max(...navs), 4),
    lowestNav: round(Math.min(...navs), 4),
    changePct: round(((latest - first) / first) * 100, 2),
  };
};

// How much of the intraday feed the detail endpoint returns. A day's worth at a
// five-minute cadence is a few hundred points — enough to draw, small enough to
// send on every refresh.
const INTRADAY_HOURS = 24;

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

  const navTicks = await getTicks(product.id, { hours: INTRADAY_HOURS });

  return {
    ...product,
    navTicks,
    performance: summarisePerformance(product.navHistory),
    intraday: summariseIntraday(navTicks),
  };
};
