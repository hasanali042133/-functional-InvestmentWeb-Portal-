import { z } from 'zod';
import { env } from '../config/env.js';

const email = z
  .string({ required_error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .min(1, 'Enter your email address.')
  .email('Enter a valid email address.')
  .max(255, 'This is too long.');

const password = z
  .string({ required_error: 'Enter a password.' })
  .min(8, 'Use at least 8 characters.')
  .max(72, 'This is too long.')
  .regex(/[A-Za-z]/, 'Include a letter.')
  .regex(/[0-9]/, 'Include a number.');

const fullName = z
  .string({ required_error: 'Enter your full name.' })
  .trim()
  .min(2, 'Enter your full name.')
  .max(100, 'This is too long.')
  .regex(/^[\p{L}\s.'-]+$/u, 'Use letters only.');

const otpCode = z
  .string({ required_error: 'Enter the code from your email.' })
  .trim()
  .regex(
    new RegExp(`^[0-9]{${env.OTP_LENGTH}}$`),
    'Enter the code from your email.',
  );

export const registerSchema = z.object({
  fullName,
  email,
  password,
});

export const verifyOtpSchema = z.object({
  email,
  code: otpCode,
});

export const resendOtpSchema = z.object({
  email,
});

export const loginSchema = z.object({
  email,
  // Login deliberately does not enforce the signup password policy — an old or
  // mistyped password should fail as "invalid credentials", not as a validation
  // error that reveals the policy.
  password: z.string({ required_error: 'Enter your password.' }).min(1, 'Enter your password.'),
});
