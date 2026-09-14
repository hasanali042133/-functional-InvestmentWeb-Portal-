import { z } from 'zod';
import { env } from '../config/env.js';

const email = z
  .string({ required_error: 'Email address is required.' })
  .trim()
  .toLowerCase()
  .min(1, 'Email address is required.')
  .email('Please enter a valid email address.')
  .max(255, 'Email address is too long.');

const password = z
  .string({ required_error: 'Password is required.' })
  .min(8, 'Password must be at least 8 characters.')
  .max(72, 'Password must be 72 characters or fewer.')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

const fullName = z
  .string({ required_error: 'Full name is required.' })
  .trim()
  .min(2, 'Full name must be at least 2 characters.')
  .max(100, 'Full name must be 100 characters or fewer.')
  .regex(/^[\p{L}\s.'-]+$/u, 'Full name can only contain letters, spaces and . \' -');

const otpCode = z
  .string({ required_error: 'Verification code is required.' })
  .trim()
  .regex(
    new RegExp(`^[0-9]{${env.OTP_LENGTH}}$`),
    `Verification code must be ${env.OTP_LENGTH} digits.`,
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
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
});
