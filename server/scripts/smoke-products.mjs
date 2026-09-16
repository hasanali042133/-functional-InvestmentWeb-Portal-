// End-to-end smoke test for the products module.
// Requires the API to be running and the database seeded:
//   npm run db:seed   then   npm run dev   then   npm run test:products

const BASE = process.env.API_URL ?? 'http://localhost:5000';

const DEMO = { email: 'assessment@example.com', password: 'Assessment123' };

let pass = 0;
let fail = 0;

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
};

const check = (label, condition, detail = '') => {
  if (condition) {
    pass++;
    console.log(`  PASS  ${label}${detail ? '  ->  ' + detail : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? '  ->  ' + detail : ''}`);
  }
};

console.log('\n=== AUTHORISATION ===');
const anon = await call('/api/products');
check('listing requires a token', anon.status === 401, `${anon.status} ${anon.body.code}`);

// Signing in is two steps now: credentials earn an emailed code, then the code
// and the credentials together earn the token.
const requested = await call('/api/auth/login/request-code', { method: 'POST', body: DEMO });
const loginCode = requested.body.data?.devOtp;
const login = loginCode
  ? await call('/api/auth/login', { method: 'POST', body: { ...DEMO, code: loginCode } })
  : requested;
check('demo account can sign in', login.status === 200, `${login.status}`);
const token = login.body.data?.token;

if (!token) {
  console.log('\nCannot continue without a token. Has the database been seeded?\n');
  process.exit(1);
}

console.log('\n=== LISTING ===');
const list = await call('/api/products', { token });
const products = list.body.data?.products ?? [];
check('returns products', list.status === 200 && products.length >= 3, `${products.length} products`);

const risks = products.map((p) => p.riskLevel);
check(
  'ordered low to high risk',
  JSON.stringify(risks) === JSON.stringify(['LOW', 'MEDIUM', 'HIGH']),
  risks.join(' -> '),
);

check(
  'money fields are numbers, not strings',
  products.every((p) => typeof p.minInvestment === 'number' && typeof p.currentNav === 'number'),
  `minInvestment is ${typeof products[0]?.minInvestment}`,
);

const required = ['id', 'code', 'name', 'category', 'riskLevel', 'minInvestment', 'expectedReturnPct', 'description'];
check(
  'every documented field is present',
  products.every((p) => required.every((key) => p[key] !== undefined)),
);

check('listing omits the price history', products.every((p) => p.navHistory === undefined));

console.log('\n=== DETAIL ===');
const growth = products.find((p) => p.code === 'GROWTH');
const detail = await call(`/api/products/${growth.id}`, { token });
const product = detail.body.data?.product;

check('returns the product', detail.status === 200 && product?.code === 'GROWTH');
// The seed lays down 90 days; the price simulator then publishes one row per
// day on top of that, so this is a floor rather than an exact count.
check(
  'includes at least 90 days of history',
  product?.navHistory?.length >= 90,
  `${product?.navHistory?.length} points`,
);
check(
  'history is date-only and ascending',
  /^\d{4}-\d{2}-\d{2}$/.test(product.navHistory[0].date) &&
    product.navHistory[0].date < product.navHistory.at(-1).date,
  `${product.navHistory[0].date} -> ${product.navHistory.at(-1).date}`,
);

check(
  'current NAV matches the last history point',
  product.currentNav === product.navHistory.at(-1).nav,
  `${product.currentNav} vs ${product.navHistory.at(-1).nav}`,
);

const perf = product.performance;
check('includes a performance summary', Boolean(perf), perf ? `${perf.changePct}% over ${perf.periodDays} days` : '');
check(
  'performance is consistent with the series',
  perf.startingNav === product.navHistory[0].nav && perf.currentNav === product.currentNav,
);
check(
  'high and low bound the series',
  perf.highestNav >= product.currentNav && perf.lowestNav <= product.currentNav,
  `${perf.lowestNav} .. ${perf.highestNav}`,
);
check(
  'growth fund trends upward over the period',
  perf.changePct > 0,
  `${perf.changePct}%`,
);

console.log('\n=== INTRADAY ===');
const ticks = product.navTicks ?? [];
const intraday = product.intraday;

check('detail includes an intraday series', ticks.length >= 2, `${ticks.length} ticks`);

check(
  'ticks carry full timestamps, not dates',
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ticks[0]?.at ?? ''),
  ticks[0]?.at,
);

check(
  'ticks are in chronological order',
  ticks.every((tick, i) => i === 0 || new Date(ticks[i - 1].at) <= new Date(tick.at)),
);

check(
  'the last tick is the current NAV',
  ticks.at(-1).nav === product.currentNav,
  `${ticks.at(-1).nav} vs ${product.currentNav}`,
);

check(
  'intraday ticks leave the daily series alone',
  product.navHistory.every((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.date)) &&
    product.navHistory.at(-1).nav === product.currentNav,
  `${product.navHistory.length} daily points, one per day`,
);

check('includes an intraday summary', Boolean(intraday), intraday ? `${intraday.points} points` : '');

check(
  'intraday high and low bound the series',
  intraday.highestNav >= product.currentNav && intraday.lowestNav <= product.currentNav,
  `${intraday.lowestNav} .. ${intraday.highestNav}`,
);

check(
  'intraday summary matches the series it describes',
  intraday.openingNav === ticks[0].nav && intraday.currentNav === ticks.at(-1).nav,
);

check(
  'intraday window is at most 24 hours',
  new Date(intraday.to) - new Date(intraday.from) <= 24 * 60 * 60 * 1000 + 60000,
  `${((new Date(intraday.to) - new Date(intraday.from)) / 3600000).toFixed(1)}h`,
);

console.log('\n=== SCHEDULED PRICE TICK ===');

// The endpoint an external scheduler calls where an in-process timer cannot
// survive. Whether it exists at all depends on CRON_SECRET, so both shapes are
// legitimate — what must never happen is an unauthenticated caller moving
// prices.
const tick = (token) =>
  call('/api/nav/tick', { method: 'POST', ...(token ? { token } : {}) });

const noAuth = await tick();
const guarded = noAuth.status === 404;

check(
  guarded
    ? 'the tick endpoint does not exist without a secret'
    : 'the tick endpoint refuses an unauthenticated caller',
  guarded ? noAuth.body.code === 'NOT_FOUND' : noAuth.status === 401,
  `${noAuth.status} ${noAuth.body.code}`,
);

const wrongSecret = await tick('clearly-not-the-right-secret');
check(
  'a wrong secret never moves prices',
  wrongSecret.status === 404 || wrongSecret.status === 401,
  `${wrongSecret.status} ${wrongSecret.body.code}`,
);

console.log('\n=== ERRORS ===');
const notFound = await call('/api/products/11111111-1111-1111-1111-111111111111', { token });
check('unknown id -> 404', notFound.status === 404 && notFound.body.code === 'PRODUCT_NOT_FOUND', `${notFound.status}`);

const badId = await call('/api/products/not-a-uuid', { token });
check('malformed id -> 422', badId.status === 422 && badId.body.code === 'VALIDATION_ERROR', `${badId.status}`);

const noToken = await call(`/api/products/${growth.id}`);
check('detail requires a token', noToken.status === 401, `${noToken.status}`);

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail === 0 ? 0 : 1);
