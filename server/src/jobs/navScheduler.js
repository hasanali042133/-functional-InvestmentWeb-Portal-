import { env } from '../config/env.js';
import { advanceNav } from '../services/nav.service.js';

const run = async (reason, { force }) => {
  try {
    const { moves } = await advanceNav({ force });

    if (moves.length === 0) {
      console.info(`[nav] ${reason}: prices for today are already published`);
      return;
    }

    console.info(
      `[nav] ${moves
        .map((move) => `${move.code} ${move.nav} (${move.changePct >= 0 ? '+' : ''}${move.changePct}%)`)
        .join('  ')}`,
    );
  } catch (error) {
    // A failed re-pricing must not take the API down with it; the previous
    // price simply stands until the next tick.
    console.error(`[nav] ${reason} failed:`, error.message);
  }
};

/**
 * Re-prices every fund on a fixed interval, so the charts and portfolio
 * valuations visibly move while the application is being used.
 *
 * The boot run does not force: if today's prices already exist they are left
 * alone, so restarting the server does not jolt the price. Every tick after
 * that does force, because a tick's whole purpose is to publish a new price.
 *
 * Returns a stop function so shutdown does not leave a timer pending.
 */
export const startNavScheduler = () => {
  const minutes = env.NAV_SIMULATION_INTERVAL_MINUTES;

  void run('boot', { force: false });

  const intervalId = setInterval(() => void run('tick', { force: true }), minutes * 60 * 1000);

  console.info(`[nav] simulated prices enabled, re-pricing every ${minutes} minute(s)`);

  return () => clearInterval(intervalId);
};
