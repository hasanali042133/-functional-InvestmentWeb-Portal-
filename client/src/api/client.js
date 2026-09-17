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

/**
 * How many requests are in the air, and who wants to know.
 *
 * Individual screens already say what they are waiting for — a skeleton shaped
 * like the table that is coming, a spinner inside the button that was pressed.
 * This is the one thing they cannot say: that something is happening at all,
 * somewhere, when the waiting is not attached to anything the customer is
 * looking at. A background refresh, a cold server taking its time, a request
 * whose screen has not been painted yet.
 *
 * Counted here rather than in each caller because this is the only place every
 * request must pass through.
 */
let inFlight = 0;
const watchers = new Set();

const notify = () => {
  for (const watcher of watchers) watcher();
};

export const getInFlight = () => inFlight;

export const subscribeToRequests = (watcher) => {
  watchers.add(watcher);
  return () => watchers.delete(watcher);
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  inFlight += 1;
  notify();

  return config;
});

// Paired with the increment above. Once axios has a config the response
// pipeline always runs, success or failure, so the count cannot be stranded.
const settled = () => {
  inFlight = Math.max(0, inFlight - 1);
  notify();
};

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
  (response) => {
    settled();
    return response;
  },
  (error) => {
    settled();

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

    // Only a 401 means the stored token itself is no longer usable — it is
    // missing, expired, invalid, or the account behind it is gone.
    //
    // A 403 is the opposite case: the token is fine and the customer is known,
    // they just have a step left before this particular action is allowed
    // (EMAIL_NOT_VERIFIED, ACCOUNT_NOT_APPROVED). Signing them out there would
    // throw them to the login screen instead of to the step they need.
    const sessionGone = status === 401;

    if (sessionGone && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(apiError);
  },
);

/** Unwraps the `data` payload so callers are not writing `res.data.data` everywhere. */
export const unwrap = (response) => response.data?.data;
