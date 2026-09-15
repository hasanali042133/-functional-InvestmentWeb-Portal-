/**
 * How often screens showing live fund prices refresh themselves.
 *
 * The server publishes a new simulated price every few minutes; this only
 * decides how soon a page notices. Kept in one place so every live screen
 * moves together rather than each picking its own interval.
 */
export const LIVE_POLL_MS = 30_000;
