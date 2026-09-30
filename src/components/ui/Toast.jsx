import { useState, useCallback, createContext, useContext, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  default: Info,
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  default: 'text-gray-500',
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  default: 'bg-gray-50 border-gray-200',
};

function ToastItem({ toast, onRemove }) {
  const Icon = icons[toast.type] || icons.default;
  return (
    <div
      className={`flex items-start gap-3 p-4 border rounded-lg shadow-lg ${bgColors[toast.type]} animate-slide-in`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`} strokeWidth={2} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-medium text-gray-900">{toast.title}</p>}
        {toast.message && <p className="text-sm text-gray-600 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1"
        aria-label="Dismiss"
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useContext(ToastContext);
  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-80 max-w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, type: 'default', ...toast };
    setToasts((prev) => [...prev, newToast]);
    if (newToast.duration !== 0) {
      setTimeout(() => removeToast(id), newToast.duration || 4000);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, options = {}) => addToast({ message, ...options }),
    [addToast]
  );

  toast.success = (message, options) => addToast({ message, type: 'success', ...options });
  toast.error = (message, options) => addToast({ message, type: 'error', ...options });
  toast.info = (message, options) => addToast({ message, type: 'info', ...options });

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
}