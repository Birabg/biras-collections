import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, SESSION } from '../../auth/AuthContext';
import { LoadingRegion } from '../ui/LoadingState';

/**
 * One gate for all three access levels, so there is a single route-protection
 * system in the app rather than several that can drift apart.
 *
 *   <PublicGate>        signed-out only  (login, register, reset)
 *   <ProtectedGate>     signed-in only   (account, orders, wishlist, checkout)
 *   <RoleGate roles={}> specific roles   (admin area)
 *
 * While the session is still being restored nothing is rendered and nothing is
 * redirected, which is what stops a protected page flashing before the guard
 * runs.
 */

function SessionPending() {
  return (
    <LoadingRegion label="Checking your session" className="flex min-h-[60dvh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="size-6 animate-spin rounded-full border border-ink-20 border-t-ink" aria-hidden="true" />
        <span className="t-caption">Checking your session…</span>
      </div>
    </LoadingRegion>
  );
}

function GuestOnly({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === SESSION.LOADING) return <SessionPending />;

  // Already signed in? Send them where they were headed, else to their home.
  if (status === SESSION.AUTHENTICATED) {
    const intended = location.state?.from;
    return <Navigate to={intended?.pathname ?? '/account'} replace />;
  }

  return children;
}

function AuthRequired({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === SESSION.LOADING) return <SessionPending />;

  if (status !== SESSION.AUTHENTICATED) {
    // Remember the destination so login can return the user to it
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RoleRequired({ roles, children }) {
  const { status, hasRole } = useAuth();
  const location = useLocation();

  if (status === SESSION.LOADING) return <SessionPending />;

  if (status !== SESSION.AUTHENTICATED) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated but not permitted. This is a 403, not a 401 — send them to
  // an explanation rather than bouncing them to login.
  if (!hasRole(roles)) {
    return <Navigate to="/unauthorized" replace state={{ attempted: location.pathname }} />;
  }

  return children;
}

export function PublicGate({ children }) {
  return <GuestOnly>{children}</GuestOnly>;
}

export function ProtectedGate({ children }) {
  return <AuthRequired>{children}</AuthRequired>;
}

export function RoleGate({ roles, children }) {
  return <RoleRequired roles={roles}>{children}</RoleRequired>;
}
