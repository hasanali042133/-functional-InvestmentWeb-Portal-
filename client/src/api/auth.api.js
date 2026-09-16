import { api, unwrap } from './client.js';

export const register = (payload) => api.post('/api/auth/register', payload).then(unwrap);

export const verifyOtp = (payload) => api.post('/api/auth/verify-otp', payload).then(unwrap);

export const resendOtp = (payload) => api.post('/api/auth/resend-otp', payload).then(unwrap);

/** Step one of signing in: credentials earn an emailed code. */
export const requestLoginCode = (payload) =>
  api.post('/api/auth/login/request-code', payload).then(unwrap);

/** Step two: the same credentials plus the code. */
export const login = (payload) => api.post('/api/auth/login', payload).then(unwrap);

export const forgotPassword = (payload) =>
  api.post('/api/auth/forgot-password', payload).then(unwrap);

export const resetPassword = (payload) =>
  api.post('/api/auth/reset-password', payload).then(unwrap);

export const getCurrentUser = () => api.get('/api/auth/me').then(unwrap);
