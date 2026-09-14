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
  .min(1, 'Email address is required.')
  .email('Please enter a valid email address.');

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters.')
      .max(100, 'Full name must be 100 characters or fewer.')
      .regex(/^[\p{L}\s.'-]+$/u, "Full name can only contain letters, spaces and . ' -"),
    email,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password must be 72 characters or fewer.')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
});

export const otpSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, 'Enter the 6-digit code from your email.'),
});

/** Strength hints shown under the password field while typing. */
export const passwordChecks = (value = '') => [
  { label: 'At least 8 characters', met: value.length >= 8 },
  { label: 'Contains a letter', met: /[A-Za-z]/.test(value) },
  { label: 'Contains a number', met: /[0-9]/.test(value) },
];
