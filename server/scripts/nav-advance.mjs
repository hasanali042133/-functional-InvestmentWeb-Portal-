/**
 * Publishes today's simulated fund prices on demand.
 *
 * The server does this on its own once a day, so this script exists for the
 * times when waiting for midnight is not practical — a demo, or checking that
 * the portfolio screens react to a price move.
 *
 *   node scripts/nav-advance.mjs            once per day, then a no-op
 *   node scripts/nav-advance.mjs --force    re-roll today's prices
 */

import { advanceNav } from '../src/services/nav.service.js';
import { prisma } from '../src/config/prisma.js';

const force = process.argv.includes('--force');

const main = async () => {
  const { date, moves } = await advanceNav({ force });

  if (moves.length === 0) {
    console.info(
      `\nPrices for ${date.toISOString().slice(0, 10)} are already published.` +
        '\nPass --force to re-roll them.\n',
    );
    return;
  }

  console.info(`\nPrices for ${date.toISOString().slice(0, 10)}:\n`);

  for (const move of moves) {
    const sign = move.changePct >= 0 ? '+' : '';
    console.info(
      `  ${move.name.padEnd(20)} ${String(move.previousNav).padStart(9)} -> ` +
        `${String(move.nav).padStart(9)}  (${sign}${move.changePct}%)`,
    );
  }

  console.info('');
};

main()
  .catch((error) => {
    console.error('\nnav:advance failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
