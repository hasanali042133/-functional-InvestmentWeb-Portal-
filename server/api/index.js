/**
 * Serverless entry point.
 *
 * Vercel does not run a server; it runs this function per request, so there is
 * no `listen` and no process to own a timer or a shutdown hook. Everything the
 * API actually is lives in `src/app.js`, which `src/server.js` still starts the
 * ordinary way for local development and for any host that runs a real process.
 *
 * Two consequences of that are worth knowing rather than discovering:
 *
 *  * The in-process price scheduler never starts here. Prices are advanced by
 *    an external scheduler calling `POST /api/nav/tick` instead — see
 *    `CRON_SECRET` in the README.
 *  * Rate limit counters live in the memory of one instance, so they are per
 *    instance rather than global. They still blunt a single attacker hammering
 *    one endpoint, which is what they are there for; a shared store would be
 *    the answer if this were holding back a real attack.
 */
export { default } from '../src/app.js';
