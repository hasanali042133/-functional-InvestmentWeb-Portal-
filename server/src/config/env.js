import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Validated once at boot, so a misconfigured deployment fails immediately
// rather than throwing undefined errors at request time.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5174'),
  // Absolute URL of this API, used to build links to locally stored uploads.
  PUBLIC_URL: z.string().url().default('http://localhost:5000'),

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

  // Email goes out over SMTP. With no credentials the code is logged to the
  // console instead, so development needs no external account.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Optional: defaults to SMTP_USER, which is the only sender Gmail accepts
  // from an authenticated account anyway.
  EMAIL_FROM: z.string().optional(),

  // How long a browser stays trusted after the customer asks to be remembered.
  TRUSTED_DEVICE_DAYS: z.coerce.number().int().positive().default(7),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('investment-portal'),

  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),

  // Notional cash credited to an approved account. Real funding is out of scope,
  // so this stands in for the customer's investable balance.
  INVESTABLE_CREDIT: z.coerce.number().positive().default(1_000_000),

  // Fund prices are simulated daily because there is no market behind this
  // application. Turn off if a real price feed is ever wired in.
  NAV_SIMULATION: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  // How often the in-process timer publishes a new simulated price.
  NAV_SIMULATION_INTERVAL_MINUTES: z.coerce.number().positive().default(5),

  // Shared secret for the endpoint an external scheduler calls. Left unset, that
  // endpoint does not exist at all — an unguarded way to move prices is not
  // something to leave lying around because somebody forgot to configure it.
  CRON_SECRET: z.string().min(16).optional(),

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

// Development convenience only, force-disabled in production.
export const exposeDevOtp = env.EXPOSE_DEV_OTP && !isProduction;
