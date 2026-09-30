import {
  createContext,
  useState,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TONE = {
  success: { Icon: Check, ring: 'border-success/25', accent: 'text-success', bg: 'bg-success-soft' },
  error: { Icon: AlertCircle, ring: 'border-error/25', accent: 'text-error', bg: 'bg-error-soft' },
  info: { Icon: Info, ring: 'border-ink/15', accent: 'text-ink-60', bg: 'bg-paper' },
};

function ToastItem({ toast, onDismiss }) {
  const tone = TONE[toast.type] ?? TONE.info;
  const { Icon } = tone;

  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-3 border ${tone.ring} ${tone.bg} p-4 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] animate-fade-up sm:w-88`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.accent}`}
        aria-hidden="true"
      >
        <Icon size={13} strokeWidth={2.25} />
      </span>

      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-[0.8125rem] font-medium text-ink">{toast.title}</p>}
        {toast.message && <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-60">{toast.message}</p>}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-1 shrink-0 p-1 text-ink-25 transition-colors hover:text-ink"
        aria-label="Dismiss notification"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:p-0"
      // Announcements are read by the individual items via aria-live
      aria-live="off"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type, title, options = {}) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const duration = options.duration ?? 4000;

      setToasts((prev) => [
        ...prev.slice(-2), // never let the stack grow beyond three
        { id, type, title, message: options.message },
      ]);

      if (duration !== 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }

      return id;
    },
    [dismiss],
  );

  // Clear pending timers if the provider unmounts
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  const toast = useMemo(
    () => ({
      show: (title, options) => push('info', title, options),
      success: (title, options) => push('success', title, options),
      error: (title, options) => push('error', title, options),
      info: (title, options) => push('info', title, options),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
