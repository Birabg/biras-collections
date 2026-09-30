import { forwardRef } from 'react';
import { controlClass, fieldErrorText, fieldHintText, fieldLabel, idFromLabel } from './fieldStyles';

const Textarea = forwardRef(
  ({ label, error, hint, id, name, className = '', rows = 5, required = false, ...props }, ref) => {
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

        <textarea
          ref={ref}
          id={fieldId}
          name={name}
          rows={rows}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={controlClass(Boolean(error), ['py-3 resize-y leading-relaxed', className]
            .filter(Boolean)
            .join(' '))}
          {...props}
        />

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

Textarea.displayName = 'Textarea';

export default Textarea;
