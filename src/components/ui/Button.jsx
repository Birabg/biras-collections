import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/*
 * Button — single source of truth for every actionable element.
 * Small radius, uppercase micro-label, restrained motion.
 */
const VARIANTS = {
  primary:
    'bg-ink text-paper border border-ink hover:bg-ink-80 active:bg-ink',
  secondary:
    'bg-paper text-ink border border-ink hover:bg-sand active:bg-sand-deep',
  tertiary:
    'bg-transparent text-ink border border-transparent hover:text-ink-60',
  sand: 'bg-sand text-ink border border-transparent hover:bg-sand-deep',
  danger: 'bg-error text-paper border border-error hover:brightness-110',
};

const SIZES = {
  sm: 'h-9 px-4 text-[0.6875rem] tracking-[0.14em]',
  md: 'h-11 px-6 text-[0.75rem] tracking-[0.14em]',
  lg: 'h-13 px-8 text-[0.8125rem] tracking-[0.14em]',
};

const BASE =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-[2px] font-medium uppercase ' +
  'transition-[background-color,color,border-color,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ' +
  'disabled:pointer-events-none disabled:opacity-40';

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      type = 'button',
      className = '',
      iconLeft = null,
      iconRight = null,
      ...props
    },
    ref,
  ) => {
    const isInert = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isInert}
        aria-busy={loading || undefined}
        className={[
          BASE,
          VARIANTS[variant] ?? VARIANTS.primary,
          SIZES[size] ?? SIZES.md,
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <Loader2 size={15} strokeWidth={2} className="animate-spin" aria-hidden="true" />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
