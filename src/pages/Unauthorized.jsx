import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/ui/Button';

/**
 * 403 — signed in, but not permitted.
 * Distinct from a 401: the user does not need to sign in again.
 */
export default function Unauthorized() {
  const { roleLabel, isAuthenticated } = useAuth();
  const location = useLocation();
  const attempted = location.state?.attempted;

  return (
    <div className="shell flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
      <span
        className="mb-8 flex size-16 items-center justify-center rounded-full border border-line text-ink-40"
        aria-hidden="true"
      >
        <ShieldAlert size={24} strokeWidth={1.25} />
      </span>

      <p className="t-eyebrow text-ink-40">Error 403</p>

      <h1 className="t-page mt-4">You don&rsquo;t have access to this page</h1>

      <p className="t-body mx-auto mt-4 max-w-md text-balance">
        {isAuthenticated
          ? `You are signed in as ${roleLabel}. This area is limited to other roles.`
          : 'Please sign in with an account that has access to continue.'}
      </p>

      {attempted && (
        <p className="t-caption mt-4">
          Requested: <code className="text-ink-60">{attempted}</code>
        </p>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={() => window.history.back()}>
          Go back
        </Button>

        {isAuthenticated ? (
          <Link to="/account">
            <Button size="lg" variant="secondary">
              My account
            </Button>
          </Link>
        ) : (
          <Link to="/login" state={{ from: location }}>
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
