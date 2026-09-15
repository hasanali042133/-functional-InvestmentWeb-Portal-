import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { toNumber, round, valueOf } from '../utils/money.js';

// How far back intraday prices are worth plotting. Matched to how long ticks
// are kept, since there is nothing to draw beyond that anyway.
const INTRADAY_WINDOW_HOURS = 48;

// A chart cannot usefully show more points than it has pixels.
const MAX_INTRADAY_POINTS = 360;

const dayKey = (date) => date.toISOString().slice(0, 10);

const startOfDayUtc = (date) => {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const loadHoldings = (userId) =>
  prisma.investment.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      product: { select: { id: true, name: true, riskLevel: true, currentNav: true } },
    },
  });

export const getTotalInvested = async (userId) => {
  const { _sum } = await prisma.investment.aggregate({
    where: { userId },
    _sum: { amountInvested: true },
  });

  return toNumber(_sum.amountInvested) ?? 0;
};

export const getAvailableBalance = async (userId) =>
  round(env.INVESTABLE_CREDIT - (await getTotalInvested(userId)), 2);

/**
 * Current value is always derived: units held multiplied by today's price.
 * Nothing about a holding's worth is stored, so a price change is reflected
 * everywhere at once.
 */
export const getSummary = async (userId) => {
  const investments = await loadHoldings(userId);

  const byProduct = new Map();

  for (const investment of investments) {
    const { product } = investment;
    const entry = byProduct.get(product.id) ?? {
      productId: product.id,
      productName: product.name,
      riskLevel: product.riskLevel,
      currentNav: toNumber(product.currentNav),
      units: 0,
      invested: 0,
    };

    entry.units += toNumber(investment.units);
    entry.invested += toNumber(investment.amountInvested);
    byProduct.set(product.id, entry);
  }

  const holdings = [...byProduct.values()].map((entry) => {
    const currentValue = valueOf(entry.units, entry.currentNav);
    const gain = round(currentValue - entry.invested, 2);

    return {
      productId: entry.productId,
      productName: entry.productName,
      riskLevel: entry.riskLevel,
      units: round(entry.units, 6),
      invested: round(entry.invested, 2),
      currentValue,
      gain,
      gainPct: entry.invested > 0 ? round((gain / entry.invested) * 100, 2) : 0,
    };
  });

  const totalInvested = round(
    holdings.reduce((sum, holding) => sum + holding.invested, 0),
    2,
  );
  const currentValue = round(
    holdings.reduce((sum, holding) => sum + holding.currentValue, 0),
    2,
  );
  const totalGain = round(currentValue - totalInvested, 2);

  for (const holding of holdings) {
    holding.sharePct = currentValue > 0 ? round((holding.currentValue / currentValue) * 100, 2) : 0;
  }

  holdings.sort((a, b) => b.currentValue - a.currentValue);

  return {
    totalInvested,
    currentValue,
    totalGain,
    gainPct: totalInvested > 0 ? round((totalGain / totalInvested) * 100, 2) : 0,
    investmentCount: investments.length,
    availableBalance: round(env.INVESTABLE_CREDIT - totalInvested, 2),
    holdings,
  };
};

/**
 * Portfolio value over time, with the amount invested drawn alongside it.
 *
 * Two series rather than one: value alone rises whenever money is added, so the
 * gap between the two is what actually shows performance.
 *
 * The granularity adapts to how long the customer has been invested. A daily
 * series is the right view for a portfolio measured in weeks, but somebody who
 * invested an hour ago has exactly one day to plot, which draws as a lone dot
 * and tells them nothing. Inside the window where intraday prices are still
 * kept, the same portfolio is valued at every published tick instead.
 */
export const getPerformance = async (userId) => {
  const investments = await loadHoldings(userId);
  if (investments.length === 0) return { granularity: 'daily', series: [] };

  const firstAt = investments[0].createdAt;
  const intradayFrom = new Date(Date.now() - INTRADAY_WINDOW_HOURS * 60 * 60 * 1000);

  if (firstAt >= intradayFrom) {
    const series = await buildIntradaySeries(investments, firstAt);
    // One tick is no more of a line than one day, so the intraday view is only
    // worth preferring when it actually has something to draw.
    if (series.length >= 2) return { granularity: 'intraday', series };
  }

  return { granularity: 'daily', series: await buildDailySeries(investments) };
};

/**
 * Values the holdings as they stood at one moment, given a price per product.
 *
 * Units are pooled per fund and each fund is rounded on its own, which is
 * exactly how `getSummary` values the same portfolio. Summing first and rounding
 * once looks equivalent and is not: the two disagree by a paisa often enough
 * that the end of this line would not match the figure on the dashboard.
 */
const valueAt = (investments, at, navByProduct, asOf = (date) => date) => {
  const unitsByProduct = new Map();
  let invested = 0;

  for (const investment of investments) {
    // `asOf` puts the purchase on the same footing as the point being drawn.
    // A daily point is stamped at midnight, so an investment made later that
    // same day still belongs to it; an intraday point is a real instant and
    // compares directly.
    if (asOf(investment.createdAt) > at) continue;

    invested += toNumber(investment.amountInvested);
    unitsByProduct.set(
      investment.productId,
      (unitsByProduct.get(investment.productId) ?? 0) + toNumber(investment.units),
    );
  }

  let value = 0;
  for (const [productId, units] of unitsByProduct) {
    value += valueOf(units, navByProduct.get(productId));
  }

  return { value: round(value, 2), invested: round(invested, 2) };
};

const buildDailySeries = async (investments) => {
  const productIds = [...new Set(investments.map((investment) => investment.productId))];
  const from = startOfDayUtc(investments[0].createdAt);

  const history = await prisma.productNavHistory.findMany({
    where: { productId: { in: productIds }, date: { gte: from } },
    orderBy: { date: 'asc' },
  });

  const navByProduct = new Map(productIds.map((id) => [id, new Map()]));
  for (const point of history) {
    navByProduct.get(point.productId).set(dayKey(point.date), toNumber(point.nav));
  }

  // Funds do not publish a price on every calendar day, so the last known price
  // is carried forward rather than leaving a gap in the line.
  const lastKnown = lastKnownFromPurchases(investments);

  const series = [];
  const today = startOfDayUtc(new Date());

  for (let date = new Date(from); date <= today; date.setUTCDate(date.getUTCDate() + 1)) {
    const key = dayKey(date);

    for (const productId of productIds) {
      const published = navByProduct.get(productId).get(key);
      if (published !== undefined) lastKnown.set(productId, published);
    }

    const { value, invested } = valueAt(investments, date, lastKnown, startOfDayUtc);
    series.push({ date: key, value, invested });
  }

  return series;
};

/**
 * The same two series, valued at every intraday price published since the first
 * investment.
 *
 * The series opens at the moment of purchase, where value equals cost by
 * definition, so the line starts from the customer's own cost basis rather than
 * from whatever the price happened to be at the next tick.
 */
const buildIntradaySeries = async (investments, from) => {
  const productIds = [...new Set(investments.map((investment) => investment.productId))];

  const ticks = await prisma.productNavTick.findMany({
    where: { productId: { in: productIds }, recordedAt: { gte: from } },
    orderBy: { recordedAt: 'asc' },
    select: { productId: true, recordedAt: true, nav: true },
  });

  if (ticks.length === 0) return [];

  const lastKnown = lastKnownFromPurchases(investments);

  const opening = valueAt(investments, from, lastKnown);
  const series = [{ at: from.toISOString(), ...opening }];

  // Ticks for all funds are published together, but they are grouped by instant
  // anyway so a missed or staggered write cannot split one moment into several
  // points on the line.
  const byInstant = new Map();
  for (const tick of ticks) {
    const key = tick.recordedAt.getTime();
    if (!byInstant.has(key)) byInstant.set(key, []);
    byInstant.get(key).push(tick);
  }

  for (const instant of [...byInstant.keys()].sort((a, b) => a - b)) {
    for (const tick of byInstant.get(instant)) {
      lastKnown.set(tick.productId, toNumber(tick.nav));
    }

    const at = new Date(instant);
    const { value, invested } = valueAt(investments, at, lastKnown);
    if (invested === 0) continue;

    series.push({ at: at.toISOString(), value, invested });
  }

  return downsample(series, MAX_INTRADAY_POINTS);
};

/** Opening price per product: what the customer actually paid for it. */
const lastKnownFromPurchases = (investments) => {
  const lastKnown = new Map();

  // `investments` is ordered oldest first, so the earliest purchase of a fund
  // sets its opening price.
  for (const investment of investments) {
    if (!lastKnown.has(investment.productId)) {
      lastKnown.set(investment.productId, toNumber(investment.navAtPurchase));
    }
  }

  return lastKnown;
};

/** Thins a series to a drawable number of points, always keeping the latest. */
const downsample = (series, max) => {
  if (series.length <= max) return series;

  const step = Math.ceil(series.length / max);
  const sampled = series.filter((_, index) => index % step === 0);
  const latest = series[series.length - 1];

  if (sampled[sampled.length - 1] !== latest) sampled.push(latest);

  return sampled;
};

/**
 * How risky the portfolio actually is, against how risky the customer said they
 * wanted it to be.
 *
 * The score is the risk of each fund weighted by how much of the portfolio it
 * represents, so a token holding in an aggressive fund does not drag the whole
 * reading upwards. Declaring a medium risk appetite and then putting 90% into an
 * equity fund is exactly the mismatch this is meant to surface.
 */

const RISK_WEIGHT = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const RISK_ORDER = ['LOW', 'MEDIUM', 'HIGH'];

// Boundaries sit a third of the way through the scale, so a portfolio has to be
// meaningfully tilted before it is called something other than its midpoint.
const levelForScore = (score) => {
  if (score < 1 + 2 / 3) return 'LOW';
  if (score < 1 + 4 / 3) return 'MEDIUM';
  return 'HIGH';
};

export const getRiskAnalysis = async (userId) => {
  const [summary, application] = await Promise.all([
    getSummary(userId),
    prisma.application.findUnique({ where: { userId }, select: { riskProfile: true } }),
  ]);

  const statedProfile = application?.riskProfile ?? null;

  if (summary.holdings.length === 0) {
    return { score: null, level: null, statedProfile, alignment: null, breakdown: [] };
  }

  // Grouped by risk level rather than by fund: two different equity funds are
  // one exposure as far as this reading is concerned.
  const byLevel = new Map();
  for (const holding of summary.holdings) {
    const entry = byLevel.get(holding.riskLevel) ?? { riskLevel: holding.riskLevel, value: 0 };
    entry.value = round(entry.value + holding.currentValue, 2);
    byLevel.set(holding.riskLevel, entry);
  }

  const breakdown = RISK_ORDER.filter((level) => byLevel.has(level)).map((level) => {
    const entry = byLevel.get(level);
    return {
      ...entry,
      sharePct: summary.currentValue > 0 ? round((entry.value / summary.currentValue) * 100, 2) : 0,
    };
  });

  const score = round(
    breakdown.reduce((total, entry) => total + (entry.sharePct / 100) * RISK_WEIGHT[entry.riskLevel], 0),
    2,
  );

  const level = levelForScore(score);

  // Above means the customer is carrying more risk than they signed up for,
  // which is the direction worth flagging.
  const alignment = statedProfile
    ? ['BELOW', 'ALIGNED', 'ABOVE'][Math.sign(RISK_ORDER.indexOf(level) - RISK_ORDER.indexOf(statedProfile)) + 1]
    : null;

  return { score, level, statedProfile, alignment, breakdown };
};
