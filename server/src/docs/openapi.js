import { env } from '../config/env.js';

/**
 * OpenAPI description of the API, served as interactive docs at /api-docs.
 *
 * The spec lives here rather than in JSDoc comments on the routes so that the
 * route files stay short and readable — the documentation is versioned with the
 * code either way.
 */

const envelope = (dataSchema, { message = 'OK' } = {}) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: message },
    data: dataSchema,
  },
});

const User = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', example: '6f2b1c4e-9a3d-4f18-b0c7-2e5d8a1f3b64' },
    fullName: { type: 'string', example: 'Assessment User' },
    email: { type: 'string', format: 'email', example: 'assessment@example.com' },
    isEmailVerified: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const Verification = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', example: 'assessment@example.com' },
    expiresAt: { type: 'string', format: 'date-time' },
    resendAfterSeconds: { type: 'integer', example: 60 },
    emailDelivered: {
      type: 'boolean',
      example: false,
      description:
        'False when SMTP is not configured, or when the send failed — the code is logged to the server console instead.',
    },
    devOtp: {
      type: 'string',
      example: '429092',
      description:
        'Development only. Present when EXPOSE_DEV_OTP=true and NODE_ENV is not production, so the flow can be tested without an inbox.',
    },
  },
};

const Product = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string', example: 'GROWTH' },
    name: { type: 'string', example: 'Growth Fund' },
    category: { type: 'string', example: 'Equity' },
    riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH' },
    minInvestment: { type: 'number', example: 5000 },
    expectedReturnPct: { type: 'number', example: 18.5 },
    description: { type: 'string' },
    currentNav: { type: 'number', example: 117.5521, description: 'Net asset value per unit.' },
  },
};

const ProductDetail = {
  allOf: [
    { $ref: '#/components/schemas/Product' },
    {
      type: 'object',
      properties: {
        performance: {
          type: 'object',
          description: 'Derived from the stored NAV history, so it always agrees with the chart.',
          properties: {
            periodDays: { type: 'integer', example: 90 },
            startingNav: { type: 'number', example: 112.4 },
            currentNav: { type: 'number', example: 117.5521 },
            highestNav: { type: 'number', example: 118.02 },
            lowestNav: { type: 'number', example: 110.31 },
            changePct: { type: 'number', example: 4.58 },
            changePct30d: { type: 'number', example: 1.62 },
            changePct7d: { type: 'number', example: 0.41 },
          },
        },
        navHistory: {
          type: 'array',
          description:
            'Daily price series used to draw the performance chart. One point per day, ' +
            'date-only so the chart is not shifted by the viewer timezone.',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date', example: '2026-09-14' },
              nav: { type: 'number', example: 117.5521 },
            },
          },
        },
        intraday: {
          type: 'object',
          nullable: true,
          description:
            'Summary of the intraday feed over the returned window. Null until at least ' +
            'two prices have been published.',
          properties: {
            points: { type: 'integer', example: 288 },
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
            openingNav: { type: 'number', example: 116.4492 },
            currentNav: { type: 'number', example: 117.5928 },
            highestNav: { type: 'number', example: 118.2774 },
            lowestNav: { type: 'number', example: 114.8692 },
            changePct: { type: 'number', example: 0.98 },
          },
        },
        navTicks: {
          type: 'array',
          description:
            'Intraday prices for the last 24 hours, oldest first. Full timestamps rather ' +
            'than dates: an intraday chart is about time of day, so it is drawn in the ' +
            'viewer own timezone. Older ticks are pruned; the daily series above is what ' +
            'survives as history.',
          items: {
            type: 'object',
            properties: {
              at: { type: 'string', format: 'date-time', example: '2026-09-15T14:47:15.258Z' },
              nav: { type: 'number', example: 117.5928 },
            },
          },
        },
      },
    },
  ],
};

const Application = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
    fullName: { type: 'string', nullable: true, example: 'Assessment User' },
    fatherName: { type: 'string', nullable: true },
    dateOfBirth: { type: 'string', format: 'date', nullable: true, example: '1994-03-18' },
    gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true },
    cnic: { type: 'string', nullable: true, example: '42101-1234567-1' },
    mobile: { type: 'string', nullable: true, example: '03001234567' },
    email: { type: 'string', format: 'email', nullable: true },
    maritalStatus: {
      type: 'string',
      enum: ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'],
      nullable: true,
    },
    addressLine1: { type: 'string', nullable: true },
    city: { type: 'string', nullable: true },
    province: { type: 'string', nullable: true },
    country: { type: 'string', nullable: true },
    postalCode: { type: 'string', nullable: true },
    employmentStatus: {
      type: 'string',
      enum: ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'STUDENT', 'RETIRED', 'UNEMPLOYED'],
      nullable: true,
    },
    occupation: { type: 'string', nullable: true },
    employerName: { type: 'string', nullable: true },
    monthlyIncome: { type: 'number', nullable: true, example: 450000 },
    sourceOfIncome: { type: 'string', nullable: true },
    expectedInvestmentAmount: { type: 'number', nullable: true, example: 500000 },
    investmentObjective: { type: 'string', nullable: true },
    riskProfile: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], nullable: true },
    investmentExperience: { type: 'string', nullable: true },
    investmentFrequency: { type: 'string', nullable: true },
    termsAccepted: { type: 'boolean' },
    submittedAt: { type: 'string', format: 'date-time', nullable: true },
    approvedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const Document = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    type: { type: 'string', enum: ['CNIC_FRONT', 'CNIC_BACK', 'PROOF_OF_ADDRESS'] },
    url: { type: 'string', format: 'uri' },
    mimeType: { type: 'string', example: 'image/jpeg' },
    sizeBytes: { type: 'integer', example: 184320 },
    isCropped: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const Holding = {
  type: 'object',
  properties: {
    productId: { type: 'string', format: 'uuid' },
    productName: { type: 'string', example: 'Growth Fund' },
    riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    units: { type: 'number', example: 904.774313 },
    invested: { type: 'number', example: 100000 },
    currentValue: { type: 'number', example: 106358.12 },
    gain: { type: 'number', example: 6358.12 },
    gainPct: { type: 'number', example: 6.36 },
    sharePct: { type: 'number', example: 58.6 },
  },
};

const Transaction = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    txnRef: { type: 'string', example: 'INV-7QK2M9XD' },
    productId: { type: 'string', format: 'uuid' },
    productName: { type: 'string', example: 'Growth Fund' },
    investmentId: { type: 'string', format: 'uuid', nullable: true },
    type: { type: 'string', enum: ['INVESTMENT', 'REDEMPTION'] },
    amount: { type: 'number', example: 50000 },
    status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const Investment = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    productId: { type: 'string', format: 'uuid' },
    productName: { type: 'string' },
    amountInvested: { type: 'number', example: 50000 },
    units: { type: 'number', example: 425.3433 },
    navAtPurchase: { type: 'number', example: 117.5521 },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

const ErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Incorrect email or password.' },
    code: {
      type: 'string',
      example: 'INVALID_CREDENTIALS',
      description: 'Stable machine-readable code the frontend can branch on.',
    },
    errors: {
      type: 'array',
      description: 'Present on validation failures.',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'password' },
          message: { type: 'string', example: 'Password must be at least 8 characters.' },
        },
      },
    },
  },
};

const jsonError = (description, example) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example,
    },
  },
});

const unauthorized = jsonError('Not signed in, or the session has expired', {
  success: false,
  message: 'Please sign in to continue.',
  code: 'MISSING_TOKEN',
});

const validationError = jsonError('Validation failed', {
  success: false,
  message: 'Please correct the highlighted fields.',
  code: 'VALIDATION_ERROR',
  errors: [{ field: 'password', message: 'Password must be at least 8 characters.' }],
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Investment / Account Opening Portal API',
    version: '1.0.0',
    description: [
      'REST API for the investment account opening portal.',
      '',
      '**How to try the protected endpoints**',
      '1. `POST /api/auth/register` — in development the response includes `data.verification.devOtp`.',
      '2. `POST /api/auth/verify-otp` with that code — the response contains a `token`.',
      '3. Click **Authorize** at the top right and paste the token.',
      '4. `GET /api/auth/me` now works.',
      '',
      'Every response uses the same envelope: `{ success, message, data }` on success,',
      '`{ success, message, code, errors? }` on failure.',
    ].join('\n'),
  },
  servers: [
    { url: '/', description: 'This server' },
    { url: `http://localhost:${env.PORT}`, description: 'Local development' },
  ],
  tags: [
    { name: 'System', description: 'Service status' },
    { name: 'Authentication', description: 'Registration, email OTP verification and sign in' },
    { name: 'Account', description: 'Account opening application and identity documents' },
    { name: 'Products', description: 'The investment products a customer can buy' },
    { name: 'Investing', description: 'Investments, transactions and portfolio' },
    {
      name: 'Scheduling',
      description: 'Operational endpoints, called by a scheduler rather than by a customer',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the `token` returned by login or verify-otp.',
      },
      cronSecret: {
        type: 'http',
        scheme: 'bearer',
        description:
          'The value of `CRON_SECRET`. A shared secret held by the scheduler, not a session token — there is no customer behind a scheduled call.',
      },
    },
    schemas: {
      User,
      Verification,
      Product,
      ProductDetail,
      Application,
      Document,
      Holding,
      Transaction,
      Investment,
      ErrorResponse,
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Used by the host platform to confirm the service is alive.',
        responses: {
          200: {
            description: 'Service is healthy',
            content: {
              'application/json': {
                example: { status: 'ok', env: 'development', timestamp: '2026-09-14T16:02:20.899Z' },
              },
            },
          },
        },
      },
    },

    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Create an account and send a verification code',
        description:
          'Creates an unverified account and emails a one-time code. Registering again with an email that exists but was never verified updates the details and sends a fresh code, rather than returning a duplicate-email error for an account the customer cannot sign into.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'email', 'password'],
                properties: {
                  fullName: { type: 'string', minLength: 2, maxLength: 100, example: 'Assessment User' },
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                  password: {
                    type: 'string',
                    minLength: 8,
                    example: 'Passw0rd123',
                    description: 'At least 8 characters, containing a letter and a number.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created, verification code sent',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    verification: { $ref: '#/components/schemas/Verification' },
                  },
                }),
              },
            },
          },
          409: jsonError('Email already registered and verified', {
            success: false,
            message: 'An account with this email already exists. Please sign in instead.',
            code: 'EMAIL_ALREADY_REGISTERED',
          }),
          422: validationError,
          429: jsonError('Too many attempts', {
            success: false,
            message: 'Too many attempts. Please try again in a few minutes.',
            code: 'AUTH_RATE_LIMITED',
          }),
        },
      },
    },

    '/api/auth/verify-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Verify the emailed code',
        description:
          'Activates the account and signs the customer in, so no separate login step is needed straight after signup. Codes are stored hashed, expire after a set window, and lock out after a limited number of wrong attempts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                  code: { type: 'string', example: '429092', description: `${env.OTP_LENGTH} digits.` },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Email verified, token issued',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                    },
                  },
                  { message: 'Email verified successfully. Welcome aboard!' },
                ),
              },
            },
          },
          400: jsonError('Code rejected — OTP_INVALID, OTP_EXPIRED, OTP_NOT_FOUND or ALREADY_VERIFIED', {
            success: false,
            message: 'That code is incorrect. You have 4 attempts left.',
            code: 'OTP_INVALID',
            errors: { attemptsRemaining: 4 },
          }),
          404: jsonError('No account for this email', {
            success: false,
            message: 'No account was found for this email address.',
            code: 'USER_NOT_FOUND',
          }),
          422: validationError,
          429: jsonError('Attempt limit reached', {
            success: false,
            message: 'Too many incorrect attempts. Please request a new code.',
            code: 'OTP_MAX_ATTEMPTS',
          }),
        },
      },
    },

    '/api/auth/resend-otp': {
      post: {
        tags: ['Authentication'],
        summary: 'Send a new verification code',
        description:
          'Discards any previous unused code and issues a new one. A per-email cooldown prevents mailbox flooding.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'New code sent',
            content: {
              'application/json': {
                schema: envelope({ $ref: '#/components/schemas/Verification' }, {
                  message: 'A new verification code has been sent to your email.',
                }),
              },
            },
          },
          400: jsonError('Email is already verified', {
            success: false,
            message: 'This email address is already verified. Please sign in.',
            code: 'ALREADY_VERIFIED',
          }),
          404: jsonError('No account for this email', {
            success: false,
            message: 'No account was found for this email address.',
            code: 'USER_NOT_FOUND',
          }),
          429: jsonError('Cooldown still active', {
            success: false,
            message: 'Please wait 43 seconds before requesting another code.',
            code: 'OTP_COOLDOWN',
            errors: { retryAfterSeconds: 43 },
          }),
        },
      },
    },

    '/api/auth/login/request-code': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in (step one: send a code to the customer)',
        description:
          'Checks the password, then emails a single-use sign-in code. The password is required before any code goes out: sending on an email address alone would let anyone flood a customer inbox, and would confirm which addresses have accounts.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                  password: { type: 'string', example: 'Passw0rd123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Code sent',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      email: { type: 'string', format: 'email' },
                      expiresAt: { type: 'string', format: 'date-time' },
                      resendAfterSeconds: { type: 'integer', example: 60 },
                      emailDelivered: { type: 'boolean', example: true },
                      devOtp: {
                        type: 'string',
                        example: '123456',
                        description: 'Only present when EXPOSE_DEV_OTP is on.',
                      },
                    },
                  },
                  { message: 'A sign-in code has been sent to your email.' },
                ),
              },
            },
          },
          401: jsonError('Incorrect credentials', {
            success: false,
            message: 'Incorrect email or password.',
            code: 'INVALID_CREDENTIALS',
          }),
          403: jsonError('Email not verified yet', {
            success: false,
            message: 'Please verify your email address before signing in.',
            code: 'EMAIL_NOT_VERIFIED',
          }),
          422: validationError,
          429: jsonError('Asked again too soon', {
            success: false,
            message: 'Please wait 45 seconds before requesting another code.',
            code: 'OTP_COOLDOWN',
          }),
        },
      },
    },

    '/api/auth/forgot-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Send a password reset code',
        description:
          'Always answers the same way, whether or not the address has an account, and whether or not a cooldown is in force. A reset form that admits no such account exists is a list of everybody who banks here, free to anyone who asks.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Answered identically for every address',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      email: { type: 'string', format: 'email' },
                      resendAfterSeconds: { type: 'integer', example: 60 },
                      expiresAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Present only when a code was actually issued.',
                      },
                      emailDelivered: { type: 'boolean' },
                    },
                  },
                  { message: 'If that email address has an account, a reset code is on its way.' },
                ),
              },
            },
          },
          422: validationError,
        },
      },
    },

    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Set a new password using a reset code',
        description:
          'The code is spent on use. The new password is held to the signup policy, since the customer is choosing it now rather than recalling an old one, and a token comes back because holding the inbox is the same proof signing in asks for.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                  code: { type: 'string', example: '123456' },
                  password: { type: 'string', example: 'Passw0rd123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password changed and signed in',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string' },
                    },
                  },
                  { message: 'Your password has been changed. You are now signed in.' },
                ),
              },
            },
          },
          400: jsonError('Code rejected', {
            success: false,
            message: 'That code is incorrect. You have 4 attempts left.',
            code: 'OTP_INVALID',
          }),
          422: validationError,
        },
      },
    },

    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in (step two: credentials and the emailed code)',
        description:
          'The password is checked again alongside the code. Without that, a code lifted from an inbox would be enough on its own, which is the opposite of what a second factor is for. The code is spent on use and cannot be replayed. An unknown email and a wrong password return an identical response, so the endpoint cannot be used to discover which addresses are registered.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                description:
                  'Either a code or a token from a remembered device is required. The password always is.',
                properties: {
                  email: { type: 'string', format: 'email', example: 'assessment@example.com' },
                  password: { type: 'string', example: 'Passw0rd123' },
                  code: {
                    type: 'string',
                    example: '123456',
                    description: 'Not needed when a valid deviceToken is sent.',
                  },
                  deviceToken: {
                    type: 'string',
                    description:
                      'Issued by an earlier sign-in that asked to be remembered. Skips the code, never the password.',
                  },
                  rememberDevice: {
                    type: 'boolean',
                    description:
                      'Ask for a device token back. Honoured only on a sign-in that passed the code, so a stolen password cannot mint one.',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Signed in',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      usedTrustedDevice: { type: 'boolean', example: false },
                      device: {
                        type: 'object',
                        description:
                          'Present only when rememberDevice was asked for and granted. Store the token; it is shown once.',
                        properties: {
                          token: { type: 'string' },
                          expiresAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                  { message: 'Signed in successfully.' },
                ),
              },
            },
          },
          400: jsonError('Neither a code nor a remembered device', {
            success: false,
            message: 'Enter the code we emailed you, or request a new one.',
            code: 'LOGIN_CODE_REQUIRED',
          }),
          401: jsonError('Incorrect credentials', {
            success: false,
            message: 'Incorrect email or password.',
            code: 'INVALID_CREDENTIALS',
          }),
          403: jsonError('Email not verified yet', {
            success: false,
            message: 'Please verify your email address before signing in.',
            code: 'EMAIL_NOT_VERIFIED',
            errors: { email: 'assessment@example.com' },
          }),
          422: validationError,
        },
      },
    },

    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get the signed-in customer',
        description:
          'The user is read fresh from the database on every request rather than trusted from the token payload, so a deleted account stops working immediately.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: { user: { $ref: '#/components/schemas/User' } },
                }),
              },
            },
          },
          401: jsonError('Missing, invalid or expired token', {
            success: false,
            message: 'Your session has expired. Please sign in again.',
            code: 'TOKEN_EXPIRED',
          }),
        },
      },
    },

    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List the available investment products',
        description:
          'Returns active products ordered from lowest to highest risk, so the listing reads as a risk ladder.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Products retrieved',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                    },
                  },
                  { message: 'Investment products retrieved.' },
                ),
              },
            },
          },
          401: jsonError('Not signed in', {
            success: false,
            message: 'Please sign in to continue.',
            code: 'MISSING_TOKEN',
          }),
        },
      },
    },

    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get one product with its price history',
        description:
          'Includes the daily NAV series and a performance summary derived from it, which the product detail screen uses for its chart.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'Product id from the listing endpoint.',
          },
        ],
        responses: {
          200: {
            description: 'Product retrieved',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: { product: { $ref: '#/components/schemas/ProductDetail' } },
                  },
                  { message: 'Product details retrieved.' },
                ),
              },
            },
          },
          401: jsonError('Not signed in', {
            success: false,
            message: 'Please sign in to continue.',
            code: 'MISSING_TOKEN',
          }),
          404: jsonError('No such product', {
            success: false,
            message: 'That investment product is not available.',
            code: 'PRODUCT_NOT_FOUND',
          }),
          422: jsonError('Malformed product id', {
            success: false,
            message: 'Please correct the highlighted fields.',
            code: 'VALIDATION_ERROR',
            errors: [{ field: 'id', message: 'That is not a valid product id.' }],
          }),
        },
      },
    },

    '/api/nav/tick': {
      post: {
        tags: ['Scheduling'],
        summary: 'Publish the next price for every fund',
        description:
          'For an external scheduler. The API advances prices on its own timer while it is running, which is no help on a host that runs it as functions or puts it to sleep when idle; a five-minute call here keeps the feed moving instead, and on a sleeping instance doubles as what wakes it. Unset `CRON_SECRET` and this endpoint answers 404: an unguarded way to move prices should not exist because a variable was forgotten.',
        security: [{ cronSecret: [] }],
        responses: {
          200: {
            description: 'Prices advanced',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      moves: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            code: { type: 'string', example: 'GROWTH' },
                            nav: { type: 'number', format: 'double', example: 118.8204 },
                            changePct: { type: 'number', format: 'double', example: -1.42 },
                          },
                        },
                      },
                    },
                  },
                  { message: 'Prices advanced.' },
                ),
              },
            },
          },
          401: jsonError('Missing or wrong secret', {
            success: false,
            message: 'Invalid scheduler credentials.',
            code: 'INVALID_CRON_SECRET',
          }),
          404: jsonError('No CRON_SECRET is configured, so the endpoint does not exist', {
            success: false,
            message: 'Not found.',
            code: 'NOT_FOUND',
          }),
        },
      },
    },

    '/api/account/application': {
      get: {
        tags: ['Account'],
        summary: 'Get the account opening application',
        description: 'An empty draft is created on first access, so this never 404s.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Application and uploaded documents',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    application: { $ref: '#/components/schemas/Application' },
                    documents: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Document' },
                    },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
      put: {
        tags: ['Account'],
        summary: 'Save part of the application',
        description:
          'Send only the fields being saved. Every field is optional here — completeness is enforced on submit — so a long form can be filled in over several sittings. Unknown fields are rejected.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Application' },
              example: {
                fullName: 'Assessment User',
                cnic: '42101-1234567-1',
                mobile: '03001234567',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Progress saved',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    application: { $ref: '#/components/schemas/Application' },
                    documents: { type: 'array', items: { $ref: '#/components/schemas/Document' } },
                  },
                }),
              },
            },
          },
          401: unauthorized,
          409: jsonError('Account already approved', {
            success: false,
            message: 'Your account has already been approved and can no longer be edited.',
            code: 'APPLICATION_LOCKED',
          }),
          422: validationError,
        },
      },
    },

    '/api/account/status': {
      get: {
        tags: ['Account'],
        summary: 'Get the account opening status',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Status',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['DRAFT', 'SUBMITTED', 'APPROVED'] },
                    canInvest: { type: 'boolean' },
                    submittedAt: { type: 'string', format: 'date-time', nullable: true },
                    approvedAt: { type: 'string', format: 'date-time', nullable: true },
                    documentsUploaded: { type: 'integer', example: 2 },
                    documentsRequired: { type: 'integer', example: 3 },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
    },

    '/api/account/documents': {
      post: {
        tags: ['Account'],
        summary: 'Upload an identity document',
        description:
          'One document per type; uploading the same type again replaces it. Files are checked against their magic bytes, not just the declared content type.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['type', 'file'],
                properties: {
                  type: {
                    type: 'string',
                    enum: ['CNIC_FRONT', 'CNIC_BACK', 'PROOF_OF_ADDRESS'],
                  },
                  isCropped: { type: 'string', enum: ['true', 'false'], default: 'false' },
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'JPG, PNG, WebP or PDF, up to 5 MB.',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Document stored',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: { document: { $ref: '#/components/schemas/Document' } },
                }),
              },
            },
          },
          400: jsonError('Rejected file — UNSUPPORTED_FILE_TYPE, FILE_TYPE_MISMATCH or FILE_REQUIRED', {
            success: false,
            message: 'That file does not look like the type it claims to be.',
            code: 'FILE_TYPE_MISMATCH',
          }),
          401: unauthorized,
          409: jsonError('Account already approved', {
            success: false,
            message: 'Your account has already been approved and its documents can no longer be changed.',
            code: 'APPLICATION_LOCKED',
          }),
          413: jsonError('File too large', {
            success: false,
            message: 'That file is too large. The limit is 5 MB.',
            code: 'FILE_TOO_LARGE',
          }),
          503: jsonError('Storage not configured', {
            success: false,
            message: 'Document uploads are not available right now.',
            code: 'STORAGE_NOT_CONFIGURED',
          }),
        },
      },
    },

    '/api/account/documents/{id}': {
      delete: {
        tags: ['Account'],
        summary: 'Remove an uploaded document',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Document removed' },
          401: unauthorized,
          404: jsonError('Not found, or not yours', {
            success: false,
            message: 'That document was not found.',
            code: 'DOCUMENT_NOT_FOUND',
          }),
        },
      },
    },

    '/api/account/submit': {
      post: {
        tags: ['Account'],
        summary: 'Submit the application for approval',
        description:
          'Re-validates every field and checks all three documents are present, then approves automatically. The checks are the gate: an incomplete application cannot be approved by calling this directly.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Approved',
            content: {
              'application/json': {
                schema: envelope(
                  {
                    type: 'object',
                    properties: {
                      application: { $ref: '#/components/schemas/Application' },
                      documents: { type: 'array', items: { $ref: '#/components/schemas/Document' } },
                    },
                  },
                  { message: 'Your account has been approved. You can now start investing.' },
                ),
              },
            },
          },
          400: jsonError(
            'Not ready — APPLICATION_INCOMPLETE, APPLICATION_INVALID, DOCUMENTS_MISSING or TERMS_NOT_ACCEPTED',
            {
              success: false,
              message: 'Please upload all required documents.',
              code: 'DOCUMENTS_MISSING',
              errors: [{ field: 'PROOF_OF_ADDRESS', message: 'This document is required.' }],
            },
          ),
          401: unauthorized,
          409: jsonError('Already approved', {
            success: false,
            message: 'Your account has already been approved.',
            code: 'ALREADY_APPROVED',
          }),
        },
      },
    },

    '/api/investments': {
      post: {
        tags: ['Investing'],
        summary: 'Invest in a fund',
        description:
          'Creates the holding and its transaction in one database transaction, so a half-recorded investment cannot exist. Units are the amount divided by the current NAV.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'amount'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  amount: { type: 'number', example: 50000 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Investment recorded',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    investment: { $ref: '#/components/schemas/Investment' },
                    transaction: { $ref: '#/components/schemas/Transaction' },
                  },
                }),
              },
            },
          },
          400: jsonError('BELOW_MINIMUM_INVESTMENT or INSUFFICIENT_BALANCE', {
            success: false,
            message: 'The minimum investment in Growth Fund is PKR 5,000.',
            code: 'BELOW_MINIMUM_INVESTMENT',
          }),
          401: unauthorized,
          403: jsonError('Account not approved yet', {
            success: false,
            message: 'Complete your account opening before investing.',
            code: 'ACCOUNT_NOT_APPROVED',
          }),
          404: jsonError('No such product', {
            success: false,
            message: 'That investment product is not available.',
            code: 'PRODUCT_NOT_FOUND',
          }),
          422: validationError,
        },
      },
      get: {
        tags: ['Investing'],
        summary: "List the customer's investments",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Investments',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    investments: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Investment' },
                    },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
    },

    '/api/transactions': {
      get: {
        tags: ['Investing'],
        summary: 'List transactions, newest first',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
        ],
        responses: {
          200: {
            description: 'Transactions',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    transactions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Transaction' },
                    },
                    pagination: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 3 },
                        totalPages: { type: 'integer', example: 1 },
                      },
                    },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
    },

    '/api/portfolio/summary': {
      get: {
        tags: ['Investing'],
        summary: 'Portfolio totals and holdings',
        description:
          'Every value is derived: units held multiplied by the current NAV. Nothing about a holding’s worth is stored, so a price change is reflected everywhere at once.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Summary',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    totalInvested: { type: 'number', example: 175000 },
                    currentValue: { type: 'number', example: 181705.8 },
                    totalGain: { type: 'number', example: 6705.8 },
                    gainPct: { type: 'number', example: 3.83 },
                    investmentCount: { type: 'integer', example: 3 },
                    availableBalance: {
                      type: 'number',
                      example: 825000,
                      description:
                        'Notional credit less the amount invested. Real funding is out of scope for this build.',
                    },
                    holdings: { type: 'array', items: { $ref: '#/components/schemas/Holding' } },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
    },

    '/api/portfolio/performance': {
      get: {
        tags: ['Investing'],
        summary: 'Portfolio value over time, against the amount invested',
        description:
          'Two series rather than one: value alone rises whenever money is added, so the gap between them is what shows performance. `granularity` says which shape the points take — `daily` points carry a `date` and are valued at each day’s published NAV; `intraday` points carry an ISO `at` timestamp and are valued at every published tick. A portfolio opened within the last 48 hours is returned intraday, because a single day plots as one dot.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Time series',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    granularity: { type: 'string', enum: ['daily', 'intraday'], example: 'daily' },
                    series: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: {
                            type: 'string',
                            format: 'date',
                            example: '2026-09-14',
                            description: 'Daily series only.',
                          },
                          at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Intraday series only.',
                          },
                          value: { type: 'number', example: 181705.8 },
                          invested: { type: 'number', example: 175000 },
                        },
                      },
                    },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
    },

    '/api/portfolio/risk': {
      get: {
        tags: ['Investing'],
        summary: 'How risky the portfolio is, against the declared risk profile',
        description:
          'Each fund’s risk level weighted by what that holding is worth today, scored from 1 (entirely low risk) to 3 (entirely high risk). Compared against the risk profile the customer chose during account opening, so a portfolio that has drifted away from what they signed up for is visible. `alignment` is `ABOVE` when they are carrying more risk than they declared.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Risk analysis. Every field is null until the customer holds something.',
            content: {
              'application/json': {
                schema: envelope({
                  type: 'object',
                  properties: {
                    score: { type: 'number', nullable: true, example: 2.48 },
                    level: {
                      type: 'string',
                      nullable: true,
                      enum: ['LOW', 'MEDIUM', 'HIGH'],
                      example: 'HIGH',
                    },
                    statedProfile: {
                      type: 'string',
                      nullable: true,
                      enum: ['LOW', 'MEDIUM', 'HIGH'],
                      example: 'MEDIUM',
                      description: 'Taken from the account opening application.',
                    },
                    alignment: {
                      type: 'string',
                      nullable: true,
                      enum: ['BELOW', 'ALIGNED', 'ABOVE'],
                      example: 'ABOVE',
                    },
                    breakdown: {
                      type: 'array',
                      description: 'Exposure by risk level, low to high.',
                      items: {
                        type: 'object',
                        properties: {
                          riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
                          value: { type: 'number', example: 116358.12 },
                          sharePct: { type: 'number', example: 60.7 },
                        },
                      },
                    },
                  },
                }),
              },
            },
          },
          401: unauthorized,
        },
      },
    },
  },
};
