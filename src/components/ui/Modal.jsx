import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(96rem,calc(100%-2rem))]',
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function Modal({ isOpen, onClose, title, children, size = 'md', showClose = true, className = '' }) {
  const panelRef = useRef(null);
  const restoreFocusTo = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Keep focus inside the dialog while it is open
      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null,
      );
      if (nodes.length === 0) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreFocusTo.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Move focus into the panel once it has rendered
    const raf = requestAnimationFrame(() => {
      const target = panelRef.current?.querySelector(FOCUSABLE) ?? panelRef.current;
      target?.focus?.();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      if (restoreFocusTo.current instanceof HTMLElement) {
        restoreFocusTo.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-paper shadow-[0_24px_70px_-20px_rgba(0,0,0,0.35)] outline-none animate-fade-up ${SIZES[size] ?? SIZES.md} ${className}`}
      >
        {(title || showClose) && (
          <div className="flex shrink-0 items-center justify-between border-b border-line px-6 py-5">
            {title ? (
              <h2 className="t-section !text-xl">{title}</h2>
            ) : (
              <span />
            )}

            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 p-2 text-ink-40 transition-colors hover:text-ink"
                aria-label="Close dialog"
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
