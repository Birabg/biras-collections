import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { controlClass, fieldErrorText, fieldHintText, fieldLabel, idFromLabel } from './fieldStyles';

/*
 * Select — native control, restyled. Keeping the native element preserves
 * keyboard behaviour and mobile pickers.
 */
const Select = forwardRef(
  (
    {
      label,
      error,
      hint,
      id,
      name,
      className = '',
      children,
      required = false,
      ...props
    },
    ref,
  ) => {
    const fieldId = idFromLabel(label, name || id);
    const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={fieldId} className={fieldLabel}>
            {label}
            {required && (
              <span className="ml-1 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            name={name}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={controlClass(Boolean(error), [
              'h-12 appearance-none pr-11',
              // Keep the text left-aligned even on Windows Chrome selects
              'text-left',
              className,
            ]
              .filter(Boolean)
              .join(' '))}
            {...props}
          >
            {children}
          </select>

          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-40"
            aria-hidden="true"
          />
        </div>

        {error ? (
          <p id={`${fieldId}-error`} className={fieldErrorText} role="alert">
            {error}
          </p>
        ) : (
          hint && (
            <p id={`${fieldId}-hint`} className={fieldHintText}>
              {hint}
            </p>
          )
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export default Select;
