import { api, unwrap } from './client.js';

export const register = (payload) => api.post('/api/auth/register', payload).then(unwrap);

export const verifyOtp = (payload) => api.post('/api/auth/verify-otp', payload).then(unwrap);

export const resendOtp = (payload) => api.post('/api/auth/resend-otp', payload).then(unwrap);

export const login = (payload) => api.post('/api/auth/login', payload).then(unwrap);

export const getCurrentUser = () => api.get('/api/auth/me').then(unwrap);
