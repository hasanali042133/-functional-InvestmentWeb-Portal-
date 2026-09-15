// Prisma returns Decimal objects for NUMERIC columns, which JSON.stringify would
// render as strings. These convert at the response boundary; storage and
// arithmetic stay in fixed-precision decimal.

export const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : Number(value.toString());
};

export const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
};

export const unitsFor = (amount, nav) => round(toNumber(amount) / toNumber(nav), 6);

export const valueOf = (units, nav) => round(toNumber(units) * toNumber(nav), 2);
