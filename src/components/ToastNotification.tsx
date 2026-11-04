import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  X,
  Sparkles,
  ExternalLink,
  Film,
  Mic,
  ArrowRight,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000. 0 means persistent until dismissed
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string;
  dismissToast: (id: string) => void;
  dismiss: (id: string) => void;
  success: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => string;
  error: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => string;
  loading: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => string;
  info: (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type,
      title,
      message,
      duration = type === 'loading' ? 0 : 4500,
      action,
    }: Omit<ToastItem, 'id' | 'createdAt'>): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem: ToastItem = {
        id,
        type,
        title,
        message,
        duration,
        action,
        createdAt: Date.now(),
      };

      setToasts((prev) => [newItem, ...prev.slice(0, 4)]); // max 5 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => {
      return showToast({ type: 'success', title, message, ...options });
    },
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => {
      return showToast({ type: 'error', title, message, ...options });
    },
    [showToast]
  );

  const loading = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => {
      return showToast({ type: 'loading', title, message, duration: 0, ...options });
    },
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Omit<ToastItem, 'id' | 'type' | 'title' | 'createdAt'>>) => {
      return showToast({ type: 'info', title, message, ...options });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        dismiss: dismissToast,
        success,
        error,
        loading,
        info,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificaciones del sistema"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </aside>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const styleConfig = {
    success: {
      bg: 'bg-white',
      border: 'border-emerald-500/80',
      shadow: 'shadow-[0_10px_35px_rgba(16,185,129,0.18)]',
      iconBg: 'bg-emerald-500 text-white',
      icon: <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />,
      badgeText: 'ÉXITO',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    },
    error: {
      bg: 'bg-white',
      border: 'border-rose-500/80',
      shadow: 'shadow-[0_10px_35px_rgba(244,63,94,0.18)]',
      iconBg: 'bg-rose-500 text-white',
      icon: <AlertCircle className="w-5 h-5 stroke-[2.5]" />,
      badgeText: 'ERROR',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-600',
    },
    loading: {
      bg: 'bg-gradient-to-r from-white via-[#FFFDF9] to-[#FEFBF2]',
      border: 'border-amber-400',
      shadow: 'shadow-[0_10px_35px_rgba(245,158,11,0.22)]',
      iconBg: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950',
      icon: <Loader2 className="w-5 h-5 animate-spin stroke-[2.5]" />,
      badgeText: 'PROCESANDO',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse',
      progressBar: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 animate-pulse',
    },
    info: {
      bg: 'bg-white',
      border: 'border-sky-400/80',
      shadow: 'shadow-[0_10px_35px_rgba(14,165,233,0.18)]',
      iconBg: 'bg-sky-500 text-white',
      icon: <Info className="w-5 h-5 stroke-[2.5]" />,
      badgeText: 'INFO',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      progressBar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    },
  }[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border-2 ${styleConfig.border} ${styleConfig.bg} ${styleConfig.shadow} p-4 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in-50`}
    >
      <div className="flex items-start gap-3">
        {/* State Icon */}
        <div
          className={`w-9 h-9 rounded-xl ${styleConfig.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
        >
          {styleConfig.icon}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${styleConfig.badgeBg}`}
            >
              {styleConfig.badgeText}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              KINETIX ESTUDIO IA
            </span>
          </div>

          <h4 className="text-sm font-extrabold text-slate-950 leading-snug break-words">
            {toast.title}
          </h4>

          {toast.message && (
            <p className="text-xs text-slate-700 mt-1 leading-relaxed break-words font-medium">
              {toast.message}
            </p>
          )}

          {/* Action Button if specified */}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss();
              }}
              className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-amber-600 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
            >
              <span>{toast.action.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          title="Cerrar notificación"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown Progress Bar for auto-dismissing toasts */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
          <div
            className={`h-full ${styleConfig.progressBar} transition-all duration-75`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
