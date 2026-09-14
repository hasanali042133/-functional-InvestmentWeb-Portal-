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

const login = await call('/api/auth/login', { method: 'POST', body: DEMO });
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
check('includes 90 days of history', product?.navHistory?.length === 90, `${product?.navHistory?.length} points`);
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

console.log('\n=== ERRORS ===');
const notFound = await call('/api/products/11111111-1111-1111-1111-111111111111', { token });
check('unknown id -> 404', notFound.status === 404 && notFound.body.code === 'PRODUCT_NOT_FOUND', `${notFound.status}`);

const badId = await call('/api/products/not-a-uuid', { token });
check('malformed id -> 422', badId.status === 422 && badId.body.code === 'VALIDATION_ERROR', `${badId.status}`);

const noToken = await call(`/api/products/${growth.id}`);
check('detail requires a token', noToken.status === 401, `${noToken.status}`);

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail === 0 ? 0 : 1);
