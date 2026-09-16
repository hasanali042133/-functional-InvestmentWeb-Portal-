import { asyncHandler, sendSuccess, sendCreated } from '../utils/apiResponse.js';
import * as authService from '../services/auth.service.js';

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  return sendCreated(res, {
    message: 'Account created. Please check your email for the verification code.',
    data: result,
  });
});

/** POST /api/auth/verify-otp */
export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.body);

  return sendSuccess(res, {
    message: 'Email verified successfully. Welcome aboard!',
    data: result,
  });
});

/** POST /api/auth/resend-otp */
export const resendOtp = asyncHandler(async (req, res) => {
  const verification = await authService.resendVerificationCode(req.body);

  return sendSuccess(res, {
    message: 'A new verification code has been sent to your email.',
    data: verification,
  });
});

/** POST /api/auth/login/request-code */
export const requestLoginCode = asyncHandler(async (req, res) => {
  const verification = await authService.requestLoginCode(req.body);

  return sendSuccess(res, {
    message: 'A sign-in code has been sent to your email.',
    data: verification,
  });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser({
    ...req.body,
    // Only the request knows which browser this is; the service just labels it.
    userAgent: req.get('user-agent'),
  });

  return sendSuccess(res, {
    message: 'Signed in successfully.',
    data: result,
  });
});

/** POST /api/auth/forgot-password */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body);

  // Deliberately identical whether or not the address has an account, so the
  // response cannot be used to find out who banks here.
  return sendSuccess(res, {
    message: 'If that email address has an account, a reset code is on its way.',
    data: result,
  });
});

/** POST /api/auth/reset-password */
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  return sendSuccess(res, {
    message: 'Your password has been changed. You are now signed in.',
    data: result,
  });
});

/** GET /api/auth/me */
export const getCurrentUser = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Current user retrieved.',
    data: { user: req.user },
  }),
);
