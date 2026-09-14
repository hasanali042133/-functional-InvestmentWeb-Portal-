import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment is validated once at boot so the server fails fast and loudly
 * on a misconfigured deployment, instead of throwing `undefined` errors at
 * request time.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Read by Prisma for migrations only; optional, so a plain local Postgres
  // works with DATABASE_URL alone.
  DIRECT_URL: z.string().optional(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(10),

  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Investment Portal <onboarding@resend.dev>'),

  EXPOSE_DEV_OTP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';

/**
 * Echoing the OTP back in the API response is a development convenience only.
 * It is force-disabled in production regardless of what the env var says.
 */
export const exposeDevOtp = env.EXPOSE_DEV_OTP && !isProduction;
