import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { tokenStore, SESSION_EXPIRED_EVENT } from '@/api/client.js';
import * as authApi from '@/api/auth.api.js';

export const AuthContext = createContext(null);

/**
 * Holds the signed-in customer for the whole app.
 *
 * On boot, a stored token is verified against `/api/auth/me` rather than
 * trusted: the token may have expired, or the account may no longer exist. Until
 * that check resolves the status is `loading`, which stops protected routes from
 * bouncing a signed-in customer to the login screen on a refresh.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'anonymous');

  const signIn = useCallback(({ token, user: nextUser }) => {
    tokenStore.set(token);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStore.get()) return;

    let cancelled = false;

    authApi
      .getCurrentUser()
      .then((data) => {
        if (cancelled) return;
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => {
        // The interceptor has already cleared an invalid token.
        if (!cancelled) {
          setUser(null);
          setStatus('anonymous');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // A request rejected mid-session signs the customer out everywhere at once.
  useEffect(() => {
    const handleExpiry = () => {
      setUser(null);
      setStatus('anonymous');
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiry);
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      isLoading: status === 'loading',
      signIn,
      signOut,
      setUser,
    }),
    [user, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
