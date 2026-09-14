import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter, otpLimiter } from '../middlewares/rateLimit.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', otpLimiter, validate(resendOtpSchema), authController.resendOtp);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;
