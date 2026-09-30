import { forwardRef } from 'react';
import { controlClass, fieldErrorText, fieldHintText, fieldLabel, idFromLabel } from './fieldStyles';

/*
 * Input — labelled, error-aware text field.
 * Supports an optional leading `icon`, which is rendered (not spread onto the DOM).
 */
const Input = forwardRef(
  ({ label, error, hint, id, name, className = '', icon = null, required = false, ...props }, ref) => {
    const inputId = idFromLabel(label, name || id);
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className={fieldLabel}>
            {label}
            {required && (
              <span className="ml-1 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-25"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={controlClass(Boolean(error), [
              'h-12',
              icon ? 'pl-11' : '',
              className,
            ]
              .filter(Boolean)
              .join(' '))}
            {...props}
          />
        </div>

        {error ? (
          <p id={`${inputId}-error`} className={fieldErrorText} role="alert">
            {error}
          </p>
        ) : (
          hint && (
            <p id={`${inputId}-hint`} className={fieldHintText}>
              {hint}
            </p>
          )
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
