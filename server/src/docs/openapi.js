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
      description: 'False when RESEND_API_KEY is unset — the code is logged to the server console instead.',
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
          description: 'Daily price series used to draw the performance chart.',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date', example: '2026-09-14' },
              nav: { type: 'number', example: 117.5521 },
            },
          },
        },
      },
    },
  ],
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
    { name: 'Products', description: 'The investment products a customer can buy' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the `token` returned by login or verify-otp.',
      },
    },
    schemas: { User, Verification, Product, ProductDetail, ErrorResponse },
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

    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in',
        description:
          'An unknown email and a wrong password return an identical response, so the endpoint cannot be used to discover which addresses are registered.',
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
            description: 'Signed in',
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
                  { message: 'Signed in successfully.' },
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
  },
};
