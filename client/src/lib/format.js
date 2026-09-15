/** Formatting helpers shared by every screen, so money and dates look the same everywhere. */

// `currencyDisplay: 'code'` renders "PKR 50,000" rather than the "Rs" symbol,
// matching how amounts are written throughout the product brief and in the
// customer's statements.
const pkr = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
});

const pkrPrecise = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** `PKR 50,000` — the default for headline figures and tables. */
export const formatCurrency = (value, { precise = false } = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return (precise ? pkrPrecise : pkr).format(Number(value));
};

/** `50,000` without the currency, for inputs and compact cells. */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
};

/** `+4.89%` — always signed, so direction reads at a glance. */
export const formatPercent = (value, { signed = true, decimals = 2 } = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const number = Number(value);
  const sign = signed && number > 0 ? '+' : '';
  return `${sign}${number.toFixed(decimals)}%`;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parses a value into a Date, treating date-only strings as local dates.
 *
 * `new Date('1994-03-18')` is parsed as UTC midnight, which renders as 17 March
 * for anyone west of Greenwich. A date of birth or a NAV date has no time and no
 * timezone — it is the same calendar day everywhere — so the parts are read
 * directly instead of being run through UTC.
 */
export const toDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

/** `14 Sep 2026` */
export const formatDate = (value) => {
  if (!value) return '—';
  return toDate(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/** `14 Sep 2026, 10:42` — for timestamps, which do carry a time and a zone. */
export const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** `22 Jun` — compact axis labels. */
export const formatAxisDate = (value) =>
  toDate(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

/** `14:35` — compact axis labels for an intraday series, in the viewer's zone. */
export const formatAxisTime = (value) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** `1:24` — for the resend-code countdown. */
export const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const initialsOf = (fullName = '') =>
  fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';
