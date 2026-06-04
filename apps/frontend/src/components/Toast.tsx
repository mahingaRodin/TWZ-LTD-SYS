import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function refreshAdminAlerts(): void {
  window.dispatchEvent(new Event('twz:alerts-refresh'));
}

export function refreshInspectorAlerts(): void {
  window.dispatchEvent(new Event('twz:inspector-alerts-refresh'));
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((type: ToastType, title: string, message?: string) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const value: ToastContextValue = {
    success: (title, message) => push('success', title, message),
    error: (title, message) => push('error', title, message),
    info: (title, message) => push('info', title, message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3 p-4 sm:bottom-6 sm:right-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const styles = {
    success: {
      border: 'border-success/40',
      bg: 'bg-surface',
      icon: CheckCircle2,
      iconColor: 'text-success',
    },
    error: {
      border: 'border-danger/40',
      bg: 'bg-surface',
      icon: AlertCircle,
      iconColor: 'text-danger',
    },
    info: {
      border: 'border-accent/40',
      bg: 'bg-surface',
      icon: Info,
      iconColor: 'text-accent',
    },
  }[toast.type];

  const Icon = styles.icon;

  return (
    <div
      className={`pointer-events-auto flex gap-3 rounded-card border p-4 shadow-card backdrop-blur-glass ${styles.border} ${styles.bg} animate-[slideIn_0.3s_ease-out]`}
      role="status"
    >
      <Icon className={`h-6 w-6 shrink-0 ${styles.iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-sm text-muted">{toast.message}</p>}
      </div>
      <button type="button" className="btn-ghost shrink-0 p-1" onClick={onClose} aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
