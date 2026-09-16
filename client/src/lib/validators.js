import { z } from 'zod';

/**
 * Client-side mirrors of the backend's Zod schemas.
 *
 * These exist to give immediate feedback while typing — the backend validates
 * everything again regardless, and remains the authority.
 */

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.');

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Enter your full name.')
      .max(100, 'This is too long.')
      .regex(/^[\p{L}\s.'-]+$/u, 'Use letters only.'),
    email,
    password: z
      .string()
      .min(8, 'Use at least 8 characters.')
      .max(72, 'This is too long.')
      .regex(/[A-Za-z]/, 'Include a letter.')
      .regex(/[0-9]/, 'Include a number.'),
    confirmPassword: z.string().min(1, 'Re-enter your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'This is too long.')
  .regex(/[A-Za-z]/, 'Include a letter.')
  .regex(/[0-9]/, 'Include a number.');

const otpCode = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, 'Enter the 6-digit code from your email.');

/** Step one of signing in: credentials only. */
export const loginCredentialsSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});

/**
 * Step two: the same credentials, with the emailed code.
 *
 * The code is optional here because a browser the customer has been remembered
 * on does not need one. Whether it is actually required is decided where that
 * is known — on the screen, and again on the server.
 */
export const loginSchema = loginCredentialsSchema.extend({
  // `.optional()` accepts undefined but not '', and an untouched input holds
  // ''. Without the empty-string branch a remembered device — which never
  // renders the code field at all — could not submit the form.
  code: otpCode.optional().or(z.literal('')),
  rememberDevice: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z
  .object({
    code: otpCode,
    password: newPassword,
    confirmPassword: z.string().min(1, 'Re-enter your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, 'Enter the code from your email.'),
});

/** Strength hints shown under the password field while typing. */
export const passwordChecks = (value = '') => [
  { label: 'At least 8 characters', met: value.length >= 8 },
  { label: 'Contains a letter', met: /[A-Za-z]/.test(value) },
  { label: 'Contains a number', met: /[0-9]/.test(value) },
];
