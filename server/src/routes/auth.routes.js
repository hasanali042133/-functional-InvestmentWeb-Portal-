import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimit.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginCodeSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post(
  '/login/request-code',
  otpLimiter,
  validate(loginCodeSchema),
  authController.requestLoginCode,
);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

router.post(
  '/forgot-password',
  otpLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;
