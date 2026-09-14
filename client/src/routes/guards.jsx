import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.js';
import { Spinner } from '@/components/ui/Spinner.jsx';

/** Shown while a stored token is being verified against the API. */
function SessionCheck() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-brand-700">
      <Spinner size="lg" label="Restoring your session" />
    </div>
  );
}

/**
 * Gate for signed-in screens.
 *
 * While the session is still being restored nothing is decided — redirecting
 * during that window would bounce a signed-in customer to the login screen on
 * every page refresh.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <SessionCheck />;

  if (!isAuthenticated) {
    // Remember where they were going, so sign-in can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

/** Keeps an already signed-in customer out of the login and signup screens. */
export function RequireAnonymous() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SessionCheck />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
