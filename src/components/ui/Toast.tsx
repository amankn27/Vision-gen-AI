import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-[var(--vg-surface-elevated)] border-[var(--vg-status-success)]/40 text-[var(--vg-text-primary)]'
                : t.type === 'error'
                ? 'bg-[var(--vg-surface-elevated)] border-[var(--vg-status-error)]/40 text-[var(--vg-text-primary)]'
                : 'bg-[var(--vg-surface-elevated)] border-[var(--vg-border)] text-[var(--vg-text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[var(--vg-status-success)] shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[var(--vg-status-error)] shrink-0" />}
              {t.type === 'info' && <Info className="w-4 h-4 text-[var(--vg-accent-cyan)] shrink-0" />}
              <span className="text-xs font-medium leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] transition-colors cursor-pointer shrink-0"
              aria-label="Dismiss toast"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
