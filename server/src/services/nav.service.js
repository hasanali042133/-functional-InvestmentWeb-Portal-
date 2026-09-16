import { prisma } from '../config/prisma.js';
import { toNumber, round } from '../utils/money.js';

/**
 * Daily NAV simulation.
 *
 * A real fund's NAV is calculated from the market value of its holdings; there
 * is no market behind this application, so the price is simulated instead. The
 * simulation is deliberately confined to `src/services` rather than being
 * inlined into a route: if a real price feed ever replaced it, only this file
 * would change.
 */

/**
 * A band and a step size per risk level, rather than one band for every fund.
 *
 * This is what makes the risk ladder mean something. An equity fund swings
 * several points in a session and ranges widely; a money market fund barely
 * moves, which is the entire reason somebody parks cash in one. Giving all
 * three the same range and the same step made them behave identically and
 * contradicted their own descriptions.
 *
 * `step` is the largest move in one tick, tuned for the five-minute cadence the
 * scheduler runs at: visible between updates, without a day of ticks pinning
 * the price to a boundary.
 */
const RISK_PROFILE = {
  HIGH: { floor: 90, ceiling: 130, step: 5 },
  MEDIUM: { floor: 100, ceiling: 120, step: 0.8 },
  LOW: { floor: 100, ceiling: 108, step: 0.15 },
};

const profileFor = (riskLevel) => RISK_PROFILE[riskLevel] ?? RISK_PROFILE.MEDIUM;

// How strongly the edges push back at the very edge of the band.
const EDGE_BIAS = 0.45;

/**
 * How much the last move sways the next one.
 *
 * Without this every tick is close to a coin flip, and a coin flip alternates:
 * up, down, up, down, which is not how a price behaves. Real moves come in
 * runs — a fund slides for several ticks, then turns. Leaning towards whichever
 * way it just went produces those runs while leaving every individual step
 * genuinely uncertain.
 */
const MOMENTUM = 0.18;

// Never let bias become certainty: a direction that cannot be bucked would turn
// the walk into a straight line to the nearest bound.
const MIN_CHANCE = 0.08;

// The smallest a move can be, as a share of the step. Without a floor most
// ticks land near zero and the price looks frozen between the occasional jump.
const MIN_MAGNITUDE = 0.25;

/**
 * One tick's move: a random step whose *direction* is biased by how close the
 * price already is to an edge.
 *
 * Biasing the direction rather than clamping the result is what keeps the walk
 * inside the band without it sticking to a boundary — a clamp would pin the
 * price at 130 and leave it there for days at a time.
 */
export const nextNav = (currentNav, riskLevel, { previousNav, random = Math.random } = {}) => {
  const { floor, ceiling, step } = profileFor(riskLevel);
  const centre = (floor + ceiling) / 2;
  const halfBand = (ceiling - floor) / 2;

  const current = toNumber(currentNav);
  const offset = (current - centre) / halfBand; // -1 at the floor, +1 at the ceiling

  // Cubed, so the pull back is negligible through the middle of the band and
  // only bites near an edge. A linear bias behaves like constant mean
  // reversion: it holds the price around the midpoint and the fund never
  // explores the range it is supposed to move in.
  const edgePush = -(offset ** 3) * EDGE_BIAS;

  // Which way it went last time, read from the price itself rather than stored:
  // the history already knows, and a column that could drift out of step with it
  // would be one more thing to keep honest.
  const previous = toNumber(previousNav);
  const lastDirection = previous === null || previous === current ? 0 : Math.sign(current - previous);

  const upChance = Math.min(
    1 - MIN_CHANCE,
    Math.max(MIN_CHANCE, 0.5 + edgePush + lastDirection * MOMENTUM),
  );

  const direction = random() < upChance ? 1 : -1;
  const magnitude = (MIN_MAGNITUDE + (1 - MIN_MAGNITUDE) * random()) * step;

  const next = current + direction * magnitude;

  // Safety net only; the direction bias should keep the walk inside the band.
  return round(Math.min(ceiling, Math.max(floor, next)), 4);
};

// Intraday prices are kept for this long. They exist to show movement during
// the day; the daily record in `product_nav_history` is what survives as
// history, so there is nothing to gain from keeping tick-by-tick prices for
// longer than a chart will ever show.
export const TICK_RETENTION_HOURS = 48;

const todayUtc = () => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

/**
 * Re-prices every active fund and records the result.
 *
 * The history row and `currentNav` are written together: if the two ever
 * disagreed, the performance chart and the portfolio valuation would be drawn
 * from different prices.
 *
 * `product_nav_history` is unique on (product, date) and stores a date, not a
 * timestamp, so intraday ticks rewrite *today's* row rather than appending to
 * it. The chart therefore keeps one point per day, with today's point — and
 * every valuation derived from it — moving on each tick.
 *
 * Without `force` the write is idempotent by date, so a restart does not
 * disturb a price that has already been published for the day.
 */
export const advanceNav = async ({ force = false } = {}) => {
  const recordedAt = new Date();
  const date = todayUtc();
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const moves = [];

  for (const product of products) {
    const existing = await prisma.productNavHistory.findUnique({
      where: { productId_date: { productId: product.id, date } },
    });

    if (existing && !force) continue;

    const currentNav = toNumber(product.currentNav);

    // The tick before the current price, so the walk can carry its own
    // momentum. `take: 2` because the newest tick *is* the current price.
    const recent = await prisma.productNavTick.findMany({
      where: { productId: product.id },
      orderBy: { recordedAt: 'desc' },
      take: 2,
      select: { nav: true },
    });

    const previousNav = recent.length > 1 ? toNumber(recent[1].nav) : null;
    const nav = nextNav(currentNav, product.riskLevel, { previousNav });

    await prisma.$transaction([
      prisma.productNavHistory.upsert({
        where: { productId_date: { productId: product.id, date } },
        update: { nav },
        create: { productId: product.id, date, nav },
      }),
      // The same price, kept a second time against a full timestamp. This is
      // what the intraday chart is drawn from; the daily row above only ever
      // holds the latest price for the day.
      prisma.productNavTick.create({
        data: { productId: product.id, recordedAt, nav },
      }),
      prisma.product.update({ where: { id: product.id }, data: { currentNav: nav } }),
    ]);

    moves.push({
      code: product.code,
      name: product.name,
      previousNav: currentNav,
      nav,
      changePct: round(((nav - currentNav) / currentNav) * 100, 2),
    });
  }

  if (moves.length > 0) await pruneTicks();

  return { date, recordedAt, moves };
};

/** Drops intraday prices past the retention window. */
export const pruneTicks = async () => {
  const cutoff = new Date(Date.now() - TICK_RETENTION_HOURS * 60 * 60 * 1000);
  const { count } = await prisma.productNavTick.deleteMany({
    where: { recordedAt: { lt: cutoff } },
  });
  return count;
};

/** Intraday prices for one product, oldest first. */
export const getTicks = (productId, { hours = 24 } = {}) =>
  prisma.productNavTick.findMany({
    where: { productId, recordedAt: { gte: new Date(Date.now() - hours * 60 * 60 * 1000) } },
    orderBy: { recordedAt: 'asc' },
    select: { recordedAt: true, nav: true },
  });
