import axios from 'axios';

const TOKEN_KEY = 'investment-portal.token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      // Private browsing or blocked storage — the session simply will not persist.
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * The shape every screen can rely on when a request fails.
 *
 * The backend always answers with `{ success, message, code, errors }`, so the
 * only cases needing translation are the ones where no response arrived at all.
 */
export class ApiError extends Error {
  constructor({ message, code, errors, status }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.errors = errors;
    this.status = status;
  }

  /** Field errors as `{ fieldName: message }`, for handing to React Hook Form. */
  get fieldErrors() {
    if (!Array.isArray(this.errors)) return {};
    return Object.fromEntries(this.errors.map((item) => [item.field, item.message]));
  }
}

/** Raised when the token is rejected, so the auth context can sign the user out. */
export const SESSION_EXPIRED_EVENT = 'investment-portal:session-expired';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new ApiError({ message: 'The request timed out. Please try again.', code: 'TIMEOUT' }),
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError({
          message: 'Could not reach the server. Please check your connection.',
          code: 'NETWORK_ERROR',
        }),
      );
    }

    const { status, data } = error.response;
    const apiError = new ApiError({
      message: data?.message ?? 'Something went wrong. Please try again.',
      code: data?.code,
      errors: data?.errors,
      status,
    });

    // An expired or invalid token means the stored session is no longer usable.
    // Being unverified is different: the customer is known, they just have a
    // step left, so that case is handled by the screen instead.
    const sessionGone =
      status === 401 || (status === 403 && apiError.code !== 'EMAIL_NOT_VERIFIED');

    if (sessionGone && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(apiError);
  },
);

/** Unwraps the `data` payload so callers are not writing `res.data.data` everywhere. */
export const unwrap = (response) => response.data?.data;
