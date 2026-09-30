import Button from './Button';

/*
 * EmptyState — a considered empty view.
 * Every empty view in the app supplies: icon, title, description, and a CTA.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  secondaryLabel,
  onSecondary,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-20 text-center sm:py-28 ${className}`}
    >
      {Icon && (
        <span
          className="mb-7 flex size-16 items-center justify-center rounded-full border border-line text-ink-40"
          aria-hidden="true"
        >
          <Icon size={24} strokeWidth={1.25} />
        </span>
      )}

      <h2 className="t-section">{title}</h2>

      {description && (
        <p className="t-body mx-auto mt-3 max-w-sm text-balance">{description}</p>
      )}

      {(action || (actionLabel && onAction)) && (
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          {action ??
            (actionLabel && (
              <Button size="lg" onClick={onAction}>
                {actionLabel}
              </Button>
            ))}

          {secondaryLabel && onSecondary && (
            <Button size="lg" variant="tertiary" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
