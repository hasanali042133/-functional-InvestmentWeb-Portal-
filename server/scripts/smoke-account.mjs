// End-to-end smoke test for the account opening, investment and portfolio modules.
// Requires the API running and the database seeded:
//   npm run db:seed   then   npm run dev   then   npm run test:account

const BASE = process.env.API_URL ?? 'http://localhost:5000';
const DEMO = { email: 'assessment@example.com', password: 'Assessment123' };

let pass = 0;
let fail = 0;

const call = async (path, { method = 'GET', body, token, raw } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body && !raw ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: raw ? body : JSON.stringify(body) } : {}),
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

const signUpFreshUser = async () => {
  const email = `account.${Date.now()}@example.com`;
  const password = 'Passw0rd123';

  const registered = await call('/api/auth/register', {
    method: 'POST',
    body: { fullName: 'Account Tester', email, password },
  });

  const code = registered.body.data?.verification?.devOtp;
  const verified = await call('/api/auth/verify-otp', { method: 'POST', body: { email, code } });

  return { email, token: verified.body.data?.token };
};

console.log('\n=== NEW ACCOUNT ===');
const fresh = await signUpFreshUser();
check('fresh account signed in', Boolean(fresh.token));

const status = await call('/api/account/status', { token: fresh.token });
check(
  'starts as a draft, cannot invest',
  status.body.data?.status === 'DRAFT' && status.body.data?.canInvest === false,
  `${status.body.data?.status}`,
);

const blockedInvest = await call('/api/investments', {
  method: 'POST',
  token: fresh.token,
  body: { productId: '11111111-1111-1111-1111-111111111111', amount: 10000 },
});
check(
  'investing is blocked before approval',
  blockedInvest.status === 403 && blockedInvest.body.code === 'ACCOUNT_NOT_APPROVED',
  `${blockedInvest.status} ${blockedInvest.body.code}`,
);

const emptyPortfolio = await call('/api/portfolio/summary', { token: fresh.token });
check(
  'new portfolio is empty but valid',
  emptyPortfolio.status === 200 &&
    emptyPortfolio.body.data.totalInvested === 0 &&
    emptyPortfolio.body.data.holdings.length === 0,
  `invested ${emptyPortfolio.body.data?.totalInvested}, balance ${emptyPortfolio.body.data?.availableBalance}`,
);

console.log('\n=== DRAFT SAVING ===');
const savedPersonal = await call('/api/account/application', {
  method: 'PUT',
  token: fresh.token,
  body: { fullName: 'Account Tester', cnic: '42101-1234567-1', mobile: '03001234567' },
});
check('partial section saves', savedPersonal.status === 200, `${savedPersonal.status}`);

const reread = await call('/api/account/application', { token: fresh.token });
check(
  'saved values come back',
  reread.body.data?.application?.cnic === '42101-1234567-1',
  reread.body.data?.application?.cnic,
);

const badCnic = await call('/api/account/application', {
  method: 'PUT',
  token: fresh.token,
  body: { cnic: '123' },
});
check(
  'invalid CNIC rejected',
  badCnic.status === 422 && badCnic.body.errors?.[0]?.field === 'cnic',
  badCnic.body.errors?.[0]?.message,
);

const underage = await call('/api/account/application', {
  method: 'PUT',
  token: fresh.token,
  body: { dateOfBirth: new Date().toISOString().slice(0, 10) },
});
check('under-18 date of birth rejected', underage.status === 422, underage.body.errors?.[0]?.message);

const unknownField = await call('/api/account/application', {
  method: 'PUT',
  token: fresh.token,
  body: { isAdmin: true },
});
check('unknown fields rejected', unknownField.status === 422, `${unknownField.status}`);

console.log('\n=== SUBMISSION GUARDS ===');
const earlySubmit = await call('/api/account/submit', { method: 'POST', token: fresh.token });
check(
  'incomplete application cannot be submitted',
  earlySubmit.status === 400 && earlySubmit.body.code === 'APPLICATION_INCOMPLETE',
  `${earlySubmit.body.errors?.length ?? 0} fields missing`,
);

const complete = {
  fullName: 'Account Tester',
  fatherName: 'Abdul Rahman',
  dateOfBirth: '1994-03-18',
  gender: 'MALE',
  cnic: '42101-1234567-1',
  mobile: '03001234567',
  email: fresh.email,
  maritalStatus: 'SINGLE',
  addressLine1: 'House 24, Street 7, Clifton',
  city: 'Karachi',
  province: 'Sindh',
  country: 'Pakistan',
  postalCode: '75600',
  employmentStatus: 'SALARIED',
  occupation: 'Software Engineer',
  employerName: 'Northwind Technologies',
  monthlyIncome: 450000,
  sourceOfIncome: 'Salary',
  expectedInvestmentAmount: 500000,
  investmentObjective: 'Long-term wealth accumulation',
  riskProfile: 'MEDIUM',
  investmentExperience: '3-5 years',
  investmentFrequency: 'Monthly',
  termsAccepted: true,
};

await call('/api/account/application', { method: 'PUT', token: fresh.token, body: complete });

const submitWithoutDocuments = await call('/api/account/submit', {
  method: 'POST',
  token: fresh.token,
});
check(
  'submission requires documents',
  submitWithoutDocuments.status === 400 && submitWithoutDocuments.body.code === 'DOCUMENTS_MISSING',
  `${submitWithoutDocuments.body.errors?.length ?? 0} documents missing`,
);

console.log('\n=== DOCUMENT UPLOAD ===');
const noFile = await call('/api/account/documents', {
  method: 'POST',
  token: fresh.token,
  raw: (() => {
    const form = new FormData();
    form.append('type', 'CNIC_FRONT');
    return form;
  })(),
  body: undefined,
});
check('upload without a file is rejected', [400, 422].includes(noFile.status), `${noFile.status} ${noFile.body.code}`);

const badTypeForm = new FormData();
badTypeForm.append('type', 'CNIC_FRONT');
badTypeForm.append('file', new Blob(['not an image'], { type: 'text/plain' }), 'notes.txt');
const badType = await call('/api/account/documents', {
  method: 'POST',
  token: fresh.token,
  raw: true,
  body: badTypeForm,
});
check(
  'unsupported file type is rejected',
  badType.status === 400 && badType.body.code === 'UNSUPPORTED_FILE_TYPE',
  `${badType.status} ${badType.body.code}`,
);

// A real PNG header with a text/plain body would pass the declared-type check
// but fail the magic-byte check, and vice versa.
const spoofedForm = new FormData();
spoofedForm.append('type', 'CNIC_FRONT');
spoofedForm.append('file', new Blob(['this is plainly not a png'], { type: 'image/png' }), 'fake.png');
const spoofed = await call('/api/account/documents', {
  method: 'POST',
  token: fresh.token,
  raw: true,
  body: spoofedForm,
});
check(
  'file claiming a false type is rejected',
  spoofed.status === 400 && spoofed.body.code === 'FILE_TYPE_MISMATCH',
  `${spoofed.status} ${spoofed.body.code}`,
);

console.log('\n=== APPROVED ACCOUNT (seeded demo) ===');
const demoLogin = await call('/api/auth/login', { method: 'POST', body: DEMO });
const demoToken = demoLogin.body.data?.token;
check('demo account signed in', Boolean(demoToken));

const demoStatus = await call('/api/account/status', { token: demoToken });
check('demo account is approved', demoStatus.body.data?.canInvest === true, demoStatus.body.data?.status);

const summary = await call('/api/portfolio/summary', { token: demoToken });
const s = summary.body.data;
check('portfolio has holdings', s?.holdings?.length === 3, `${s?.holdings?.length} funds`);
check(
  'current value is derived from units and NAV',
  Math.abs(s.holdings.reduce((t, h) => t + h.currentValue, 0) - s.currentValue) < 1,
  `${s.currentValue}`,
);
check(
  'shares add up to 100%',
  Math.abs(s.holdings.reduce((t, h) => t + h.sharePct, 0) - 100) < 0.1,
  `${s.holdings.reduce((t, h) => t + h.sharePct, 0).toFixed(2)}%`,
);
check(
  'available balance is credit minus invested',
  s.availableBalance > 0 && s.availableBalance < 1_000_000,
  `${s.availableBalance}`,
);

const performance = await call('/api/portfolio/performance', { token: demoToken });
const series = performance.body.data?.series ?? [];
check('performance series is built from NAV history', series.length > 30, `${series.length} days`);

check(
  'a long-held portfolio is reported daily',
  performance.body.data?.granularity === 'daily',
  performance.body.data?.granularity,
);

check(
  'daily points are dates, not timestamps',
  series.every((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.date)) &&
    series.every((point) => point.at === undefined),
  series.at(-1)?.date,
);

// Exact, not approximate: the series and the summary value the same holdings,
// so a paisa of drift between them is a rounding bug, not a tolerance to allow.
check(
  'series ends exactly at the current portfolio value',
  series.at(-1).value === s.currentValue,
  `${series.at(-1)?.value} vs ${s.currentValue}`,
);
check(
  'invested amount only ever increases',
  series.every((point, index) => index === 0 || point.invested >= series[index - 1].invested),
);

const transactions = await call('/api/transactions?page=1&limit=2', { token: demoToken });
check(
  'transactions paginate',
  transactions.body.data?.transactions?.length === 2 && transactions.body.data.pagination.total >= 3,
  `page 1 of ${transactions.body.data?.pagination?.totalPages}`,
);

console.log('\n=== RISK ANALYSIS ===');
const riskRes = await call('/api/portfolio/risk', { token: demoToken });
const risk = riskRes.body.data;

check('risk analysis is returned', riskRes.status === 200 && risk?.score !== null, `score ${risk?.score}`);

check(
  'risk bands cover the whole portfolio',
  Math.abs(risk.breakdown.reduce((total, entry) => total + entry.sharePct, 0) - 100) < 0.05,
  `${risk.breakdown.reduce((total, entry) => total + entry.sharePct, 0)}%`,
);

// The score is the risk weight of each band weighted by its share, so it must
// reproduce from the breakdown the endpoint itself returned.
const weights = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const recomputed =
  Math.round(
    risk.breakdown.reduce((total, e) => total + (e.sharePct / 100) * weights[e.riskLevel], 0) * 100,
  ) / 100;
check('score is consistent with the breakdown', Math.abs(recomputed - risk.score) < 0.02, `${recomputed} vs ${risk.score}`);

check('score stays inside the 1 to 3 scale', risk.score >= 1 && risk.score <= 3, `${risk.score}`);

check(
  'band values add up to the portfolio value',
  Math.abs(risk.breakdown.reduce((total, e) => total + e.value, 0) - s.currentValue) < 0.05,
  `${risk.breakdown.reduce((total, e) => total + e.value, 0)} vs ${s.currentValue}`,
);

// The seeded demo declares a MEDIUM appetite but holds 60% in the equity fund,
// so the mismatch is the point of the check, not an accident of the data.
check(
  'a portfolio riskier than its stated profile is flagged',
  risk.statedProfile === 'MEDIUM' && risk.level === 'HIGH' && risk.alignment === 'ABOVE',
  `stated ${risk.statedProfile}, actual ${risk.level}, ${risk.alignment}`,
);

check('risk analysis requires a token', (await call('/api/portfolio/risk')).status === 401);

console.log('\n=== INVESTING ===');
const products = await call('/api/products', { token: demoToken });
const growth = products.body.data.products.find((product) => product.code === 'GROWTH');

const belowMinimum = await call('/api/investments', {
  method: 'POST',
  token: demoToken,
  body: { productId: growth.id, amount: 100 },
});
check(
  'below the fund minimum is rejected',
  belowMinimum.status === 400 && belowMinimum.body.code === 'BELOW_MINIMUM_INVESTMENT',
  belowMinimum.body.message,
);

const overBalance = await call('/api/investments', {
  method: 'POST',
  token: demoToken,
  body: { productId: growth.id, amount: 99_000_000 },
});
check(
  'more than the available balance is rejected',
  overBalance.status === 400 && overBalance.body.code === 'INSUFFICIENT_BALANCE',
  overBalance.body.message,
);

const before = (await call('/api/portfolio/summary', { token: demoToken })).body.data;
const invested = await call('/api/investments', {
  method: 'POST',
  token: demoToken,
  body: { productId: growth.id, amount: 10000 },
});
check('investment created', invested.status === 201, `${invested.status}`);
check(
  'transaction reference issued',
  /^INV-[A-Z0-9]{8}$/.test(invested.body.data?.transaction?.txnRef ?? ''),
  invested.body.data?.transaction?.txnRef,
);
check(
  'units bought match amount divided by NAV',
  Math.abs(
    invested.body.data.investment.units -
      10000 / invested.body.data.investment.navAtPurchase,
  ) < 0.001,
  `${invested.body.data?.investment?.units} units`,
);

const after = (await call('/api/portfolio/summary', { token: demoToken })).body.data;
check(
  'portfolio total invested increased by the amount',
  Math.abs(after.totalInvested - before.totalInvested - 10000) < 0.01,
  `${before.totalInvested} -> ${after.totalInvested}`,
);
check(
  'available balance decreased by the amount',
  Math.abs(before.availableBalance - after.availableBalance - 10000) < 0.01,
  `${before.availableBalance} -> ${after.availableBalance}`,
);

console.log('\n=== OWNERSHIP ===');
const otherPortfolio = await call('/api/portfolio/summary', { token: fresh.token });
check(
  "one customer cannot see another's holdings",
  otherPortfolio.body.data.holdings.length === 0 && otherPortfolio.body.data.totalInvested === 0,
);

const otherTransactions = await call('/api/transactions', { token: fresh.token });
check(
  "one customer cannot see another's transactions",
  otherTransactions.body.data.transactions.length === 0,
);

const anonymous = await call('/api/account/application');
check('account endpoints require a token', anonymous.status === 401, `${anonymous.status}`);

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
console.log('This run added an investment to the demo account. Run `npm run db:seed` to reset it.\n');
process.exit(fail === 0 ? 0 : 1);
