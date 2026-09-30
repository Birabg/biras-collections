import Button from './Button';

/*
 * ErrorState — user-facing failure view.
 * Technical detail is deliberately kept out of the default message; pass
 * `detail` only when there is something safe to surface.
 */
export default function ErrorState({
  title = 'Something went wrong.',
  description = 'We could not load this content. Please try again.',
  detail,
  onRetry,
  retryLabel = 'Try again',
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-20 text-center sm:py-28 ${className}`}
      role="alert"
    >
      <span
        className="mb-7 flex size-16 items-center justify-center rounded-full border border-error/25 bg-error-soft text-error"
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      </span>

      <h2 className="t-section">{title}</h2>

      <p className="t-body mx-auto mt-3 max-w-sm text-balance">{description}</p>

      {detail && (
        <details className="mt-5 w-full max-w-sm text-left">
          <summary className="t-caption cursor-pointer text-ink-40 transition-colors hover:text-ink">
            Technical details
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words border border-line bg-sand p-3 text-[0.75rem] leading-relaxed text-ink-60">
            {detail}
          </pre>
        </details>
      )}

      <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
        {onRetry && (
          <Button size="lg" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
