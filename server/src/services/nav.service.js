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

const NAV_FLOOR = 100;
const NAV_CEILING = 130;
const NAV_CENTRE = (NAV_FLOOR + NAV_CEILING) / 2;
const HALF_BAND = (NAV_CEILING - NAV_FLOOR) / 2;

// Largest move per tick, in NAV points. Tuned for the five-minute cadence the
// scheduler runs at: big enough to be visible on the charts between updates,
// small enough that a full day of ticks wanders rather than saturating the band.
//
// Scaled by risk so the ladder still means something — a money market fund that
// swung like an equity fund would contradict its own description.
const TICK_STEP = { HIGH: 0.4, MEDIUM: 0.2, LOW: 0.07 };

// How strongly the edges push back at the very edge of the band.
const EDGE_BIAS = 0.45;

/**
 * One tick's move: a random step whose *direction* is biased by how close the
 * price already is to an edge.
 *
 * Biasing the direction rather than clamping the result is what keeps the walk
 * inside the band without it sticking to a boundary — a clamp would pin the
 * price at 130 and leave it there for days at a time.
 */
export const nextNav = (currentNav, riskLevel, random = Math.random) => {
  const current = toNumber(currentNav);
  const offset = (current - NAV_CENTRE) / HALF_BAND; // -1 at the floor, +1 at the ceiling

  // Cubed, so the pull back is negligible through the middle of the band and
  // only bites near an edge. A linear bias behaves like constant mean
  // reversion: it holds the price around the midpoint and the fund never
  // explores the range it is supposed to move in.
  const upChance = 0.5 - offset ** 3 * EDGE_BIAS;

  const direction = random() < upChance ? 1 : -1;
  const magnitude = random() * (TICK_STEP[riskLevel] ?? TICK_STEP.MEDIUM);

  const next = current + direction * magnitude;

  // Safety net only; the direction bias should keep the walk inside the band.
  return round(Math.min(NAV_CEILING, Math.max(NAV_FLOOR, next)), 4);
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

    const previousNav = toNumber(product.currentNav);
    const nav = nextNav(previousNav, product.riskLevel);

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
      previousNav,
      nav,
      changePct: round(((nav - previousNav) / previousNav) * 100, 2),
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
