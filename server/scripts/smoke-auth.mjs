// End-to-end smoke test for the auth module.
// Requires the API to be running:  npm run dev   then:  npm run test:auth

const BASE = `${process.env.API_URL ?? 'http://localhost:5000'}/api/auth`;
const email = `smoke.${Date.now()}@example.com`;
const password = 'Passw0rd123';

let pass = 0;
let fail = 0;

const call = async (path, body, token) => {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: await res.json() };
};

const check = (label, actual, expected) => {
  const okStatus = actual.status === expected.status;
  const okCode = expected.code === undefined || actual.body.code === expected.code;
  if (okStatus && okCode) {
    pass++;
    console.log(`  PASS  ${label}  ->  ${actual.status}${actual.body.code ? ' ' + actual.body.code : ''}`);
  } else {
    fail++;
    console.log(
      `  FAIL  ${label}\n        expected ${expected.status} ${expected.code ?? ''}\n        got      ${actual.status} ${actual.body.code ?? ''} — ${actual.body.message}`,
    );
  }
  return actual;
};

console.log('\n=== HAPPY PATH ===');

const reg = check('register', await call('/register', { fullName: 'Smoke Test', email, password }), {
  status: 201,
});
const otp = reg.body.data?.verification?.devOtp;
console.log(`        devOtp = ${otp}`);

check('login before verification', await call('/login', { email, password }), {
  status: 403,
  code: 'EMAIL_NOT_VERIFIED',
});

check('wrong otp', await call('/verify-otp', { email, code: '000000' }), {
  status: 400,
  code: 'OTP_INVALID',
});

const ver = check('verify otp', await call('/verify-otp', { email, code: otp }), { status: 200 });
const tokenFromVerify = ver.body.data?.token;
console.log(`        auto-login token issued: ${Boolean(tokenFromVerify)}`);

const login = check('login', await call('/login', { email, password }), { status: 200 });
const token = login.body.data?.token;

const me = check('GET /me with token', await call('/me', null, token), { status: 200 });
console.log(`        user = ${me.body.data?.user?.email}`);
console.log(`        passwordHash leaked? ${JSON.stringify(me.body).includes('passwordHash')}`);

console.log('\n=== VALIDATION ===');
check('weak password', await call('/register', { fullName: 'X Y', email: 'w@example.com', password: 'short' }), {
  status: 422,
  code: 'VALIDATION_ERROR',
});
check('invalid email', await call('/register', { fullName: 'X Y', email: 'nope', password }), {
  status: 422,
  code: 'VALIDATION_ERROR',
});
check('missing fields', await call('/register', {}), { status: 422, code: 'VALIDATION_ERROR' });
check('otp not 6 digits', await call('/verify-otp', { email, code: '12' }), {
  status: 422,
  code: 'VALIDATION_ERROR',
});

console.log('\n=== AUTH FAILURES ===');
check('duplicate email', await call('/register', { fullName: 'Smoke Test', email, password }), {
  status: 409,
  code: 'EMAIL_ALREADY_REGISTERED',
});
check('wrong password', await call('/login', { email, password: 'WrongPass123' }), {
  status: 401,
  code: 'INVALID_CREDENTIALS',
});
check('unknown email login', await call('/login', { email: 'ghost@example.com', password }), {
  status: 401,
  code: 'INVALID_CREDENTIALS',
});
check('no token', await call('/me'), { status: 401, code: 'MISSING_TOKEN' });
check('bad token', await call('/me', null, 'garbage.token.here'), { status: 401, code: 'INVALID_TOKEN' });
check('already verified', await call('/verify-otp', { email, code: '123456' }), {
  status: 400,
  code: 'ALREADY_VERIFIED',
});

console.log('\n=== OTP COOLDOWN ===');
const email2 = `cooldown.${Date.now()}@example.com`;
await call('/register', { fullName: 'Cool Down', email: email2, password });
check('resend inside cooldown', await call('/resend-otp', { email: email2 }), {
  status: 429,
  code: 'OTP_COOLDOWN',
});

console.log('\n=== OTP ATTEMPT LOCKOUT ===');
const email3 = `lockout.${Date.now()}@example.com`;
await call('/register', { fullName: 'Lock Out', email: email3, password });
for (let i = 1; i <= 5; i++) await call('/verify-otp', { email: email3, code: '111111' });
check('6th wrong attempt locks out', await call('/verify-otp', { email: email3, code: '111111' }), {
  status: 429,
  code: 'OTP_MAX_ATTEMPTS',
});

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail === 0 ? 0 : 1);
