/**
 * Money helpers.
 *
 * Prisma returns `Decimal` objects for NUMERIC columns, which `JSON.stringify`
 * would render as strings. Responses convert them to numbers at the edge so the
 * frontend receives plain JSON, while all arithmetic and storage stay in
 * fixed-precision decimal.
 */

/** Decimal | string | number | null -> number | null */
export const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : Number(value.toString());
};

/** Rounds to a fixed number of decimal places, avoiding float drift. */
export const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
};

/** Units bought for an amount at a given price, to 6 decimal places. */
export const unitsFor = (amount, nav) => round(toNumber(amount) / toNumber(nav), 6);

/** Present value of a holding: units x current price. */
export const valueOf = (units, nav) => round(toNumber(units) * toNumber(nav), 2);
