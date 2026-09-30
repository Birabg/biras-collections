import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

/**
 * DemoBackendNotice — an honest banner for screens backed by the demo adapter.
 *
 * `title` / `body` let a caller describe what specifically is not connected
 * (no payment gateway, no order service) instead of always showing the generic
 * auth disclaimer.
 */
export default function DemoBackendNotice({ className = '', title, body }) {
  const { isDemoBackend, sessionExpired } = useAuth();

  if (!isDemoBackend) return null;

  const resolvedTitle = title ?? (sessionExpired ? 'Your session expired' : 'Demonstration mode');

  const resolvedBody =
    body ??
    (sessionExpired
      ? 'Sign in again to continue where you left off.'
      : 'No server is connected, so accounts and roles are stored in this browser only. Any role shown here is not a security boundary — the server must authorise every request.');

  return (
    <div
      className={`flex items-start gap-3 border border-warning/25 bg-warning-soft px-4 py-3 ${className}`}
      role="note"
    >
      <AlertTriangle
        size={15}
        strokeWidth={1.75}
        className="mt-0.5 shrink-0 text-warning"
        aria-hidden="true"
      />
      <p className="text-[0.8125rem] leading-relaxed text-ink-60">
        <span className="font-medium text-ink">{resolvedTitle}</span> {resolvedBody}
      </p>
    </div>
  );
}
