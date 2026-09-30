/*
 * Shared field styling so inputs, textareas and selects are visually identical.
 * Kept in its own module (not a component) to satisfy fast-refresh lint.
 */

export const fieldLabel =
  't-eyebrow block text-ink-60 mb-2';

export const fieldControl =
  [
    'w-full rounded-[2px] border bg-paper text-[0.9375rem] text-ink',
    'px-4 transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'placeholder:text-ink-25',
    'focus:outline-none focus:border-ink',
    'disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-40',
  ].join(' ');

export const fieldControlError =
  'border-error focus:border-error focus:ring-1 focus:ring-error/25';

export const fieldErrorText = 'mt-1.5 text-[0.8125rem] text-error';

export const fieldHintText = 'mt-1.5 text-[0.8125rem] text-ink-40';

/** Merge a base control class with an error/valid state. */
export function controlClass(hasError, extra = '') {
  return [fieldControl, hasError ? fieldControlError : 'border-line hover:border-ink-25', extra]
    .filter(Boolean)
    .join(' ');
}

/** Derive a stable id from a label when the caller does not supply one. */
export function idFromLabel(label, name) {
  if (name) return name;
  if (!label) return undefined;
  return label
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
