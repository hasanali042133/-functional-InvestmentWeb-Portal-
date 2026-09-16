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

/** For assertions about the body rather than the status code. */
const expect = (label, condition, detail = '') => {
  if (condition) {
    pass++;
    console.log(`  PASS  ${label}${detail ? '  ->  ' + detail : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? '  ->  ' + detail : ''}`);
  }
};

console.log('\n=== HAPPY PATH ===');

const reg = check('register', await call('/register', { fullName: 'Smoke Test', email, password }), {
  status: 201,
});
const otp = reg.body.data?.verification?.devOtp;
console.log(`        devOtp = ${otp}`);

// Everything past this point needs the code itself. The API only hands it back
// when EXPOSE_DEV_OTP is on, so say so plainly rather than letting five later
// checks fail with errors that never name the cause.
if (!otp) {
  console.log(
    '\n  Cannot continue: the rest of this suite needs the verification code,' +
      '\n  which the API only returns when EXPOSE_DEV_OTP=true.' +
      '\n' +
      '\n  Set EXPOSE_DEV_OTP=true in server/.env, restart the server, and run' +
      '\n  this again. Turn it back off afterwards if codes should only ever' +
      '\n  reach customers by email.\n',
  );

  // Let fetch's pooled sockets go idle before leaving. Exiting while they are
  // still in flight makes libuv print an assertion on Windows, which would
  // bury the message above in noise.
  await new Promise((resolve) => setTimeout(resolve, 400));
  process.exit(1);
}

// The verification screen draws its countdown ring from this deadline, so the
// server has to send one and it has to match the configured lifetime.
const verification = reg.body.data?.verification ?? {};
const lifetimeSeconds = Math.round((new Date(verification.expiresAt) - Date.now()) / 1000);
expect(
  'the code carries an expiry the client can count down to',
  Boolean(verification.expiresAt) && lifetimeSeconds > 0 && lifetimeSeconds <= 60,
  `${lifetimeSeconds}s`,
);

expect(
  'delivery status is reported',
  typeof verification.emailDelivered === 'boolean',
  `emailDelivered=${verification.emailDelivered}`,
);

check('login before verification', await call('/login/request-code', { email, password }), {
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

console.log('\n=== SIGN IN ===');
// Named rather than a generic validation failure, so the screen can say which
// of the two ways in is missing.
check('password alone will not sign in', await call('/login', { email, password }), {
  status: 400,
  code: 'LOGIN_CODE_REQUIRED',
});

const codeRequest = check(
  'correct password earns a sign-in code',
  await call('/login/request-code', { email, password }),
  { status: 200 },
);
const loginCode = codeRequest.body.data?.devOtp;

check('a wrong sign-in code is rejected', await call('/login', { email, password, code: '000000' }), {
  status: 400,
  code: 'OTP_INVALID',
});

const login = check(
  'code and password together sign in',
  await call('/login', { email, password, code: loginCode }),
  { status: 200 },
);
const token = login.body.data?.token;

// A code that stayed usable would be a password that never expires.
check('a used sign-in code cannot be replayed', await call('/login', { email, password, code: loginCode }), {
  status: 400,
  code: 'OTP_NOT_FOUND',
});

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
// A wrong password must not get as far as sending a code, or the endpoint
// becomes a way to flood any customer's inbox.
check('wrong password earns no code', await call('/login/request-code', { email, password: 'WrongPass123' }), {
  status: 401,
  code: 'INVALID_CREDENTIALS',
});
check('unknown email earns no code', await call('/login/request-code', { email: 'ghost@example.com', password }), {
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

console.log('\n=== REMEMBERED DEVICE ===');

// A remembered browser skips the emailed code. It must never skip the password:
// otherwise anyone who picks the browser up is already inside.
const deviceCodeRequest = await call('/login/request-code', { email, password });
const deviceLogin = await call('/login', {
  email,
  password,
  code: deviceCodeRequest.body.data?.devOtp,
  rememberDevice: true,
});
const deviceToken = deviceLogin.body.data?.device?.token;

expect('remembering a device issues a token', Boolean(deviceToken));

expect(
  'the token expires a week out',
  Math.round(
    (new Date(deviceLogin.body.data?.device?.expiresAt) - Date.now()) / (24 * 60 * 60 * 1000),
  ) === 7,
  deviceLogin.body.data?.device?.expiresAt,
);

const withDevice = await call('/login', { email, password, deviceToken });
check('a remembered device signs in without a code', withDevice, { status: 200 });
expect('and says so', withDevice.body.data?.usedTrustedDevice === true);

check(
  'a remembered device still demands the right password',
  await call('/login', { email, password: 'WrongPass123', deviceToken }),
  { status: 401, code: 'INVALID_CREDENTIALS' },
);

check(
  'a token that was never issued falls back to the code',
  await call('/login', { email, password, deviceToken: 'not-a-real-token' }),
  { status: 400, code: 'LOGIN_CODE_REQUIRED' },
);

console.log('\n=== FORGOT PASSWORD ===');

// A customer of its own, so the sign-in cooldown from the section above does
// not stop this one from asking for a code.
const resetEmail = `reset.${Date.now()}@example.com`;
const registeredForReset = await call('/register', {
  fullName: 'Reset Tester',
  email: resetEmail,
  password,
});
await call('/verify-otp', {
  email: resetEmail,
  code: registeredForReset.body.data?.verification?.devOtp,
});

// The reply must not differ between an address that has an account and one that
// does not, or the form becomes a way to find out who banks here.
const unknownReset = await call('/forgot-password', { email: 'nobody.here@example.com' });
const knownReset = await call('/forgot-password', { email: resetEmail });

expect(
  'an unknown address is answered like a known one',
  unknownReset.status === knownReset.status &&
    unknownReset.body.message === knownReset.body.message,
  `${unknownReset.status} / ${knownReset.status}`,
);

expect(
  'no code is issued for an address with no account',
  unknownReset.body.data?.devOtp === undefined,
);

const resetCode = knownReset.body.data?.devOtp;
const newPassword = 'Rotated9Pass';

check('a wrong reset code is rejected', await call('/reset-password', { email: resetEmail, code: '000000', password: newPassword }), {
  status: 400,
  code: 'OTP_INVALID',
});

// The new password is chosen now, so it is held to the signup policy — unlike
// the one typed at sign-in, which is only ever compared.
check('a weak new password is rejected', await call('/reset-password', { email: resetEmail, code: resetCode, password: 'short' }), {
  status: 422,
  code: 'VALIDATION_ERROR',
});

const reset = check('the reset succeeds and signs in', await call('/reset-password', { email: resetEmail, code: resetCode, password: newPassword }), {
  status: 200,
});
expect('a token comes back with the reset', Boolean(reset.body.data?.token));

check('a used reset code cannot be replayed', await call('/reset-password', { email: resetEmail, code: resetCode, password: newPassword }), {
  status: 400,
  code: 'OTP_NOT_FOUND',
});

check('the old password no longer works', await call('/login/request-code', { email: resetEmail, password }), {
  status: 401,
  code: 'INVALID_CREDENTIALS',
});

const afterReset = await call('/login/request-code', { email: resetEmail, password: newPassword });
const afterResetLogin = await call('/login', { email: resetEmail, password: newPassword, code: afterReset.body.data?.devOtp });
expect(
  'the new password signs in',
  afterResetLogin.status === 200 && Boolean(afterResetLogin.body.data?.token),
  `${afterResetLogin.status}`,
);

console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
process.exit(fail === 0 ? 0 : 1);
