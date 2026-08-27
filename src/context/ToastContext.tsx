import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, Sparkles } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, title?: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration, title }]); // max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message: string, title?: string, duration?: number) => showToast(message, 'success', duration, title || 'Success'),
    error: (message: string, title?: string, duration?: number) => showToast(message, 'error', duration, title || 'Error'),
    info: (message: string, title?: string, duration?: number) => showToast(message, 'info', duration, title || 'Notice'),
    warning: (message: string, title?: string, duration?: number) => showToast(message, 'warning', duration, title || 'Warning'),
  };

  // Intercept standard window.alert calls to convert them to smooth toasts!
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      const text = String(msg || '');
      if (text.includes('Error') || text.includes('failed') || text.includes('Cannot') || text.includes('Unable') || text.includes('⚠️') || text.includes('❌')) {
        showToast(text, 'error', 4500);
      } else if (text.includes('Warning') || text.includes('Required')) {
        showToast(text, 'warning', 4500);
      } else {
        showToast(text, 'success', 4500);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      
      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-top-6 fade-in flex items-start gap-3 relative overflow-hidden",
                isSuccess && "bg-slate-900/95 text-white border-emerald-500/40 ring-1 ring-emerald-500/20",
                isError && "bg-slate-900/95 text-white border-red-500/40 ring-1 ring-red-500/20",
                isWarning && "bg-slate-900/95 text-white border-amber-500/40 ring-1 ring-amber-500/20",
                t.type === 'info' && "bg-slate-900/95 text-white border-blue-500/40 ring-1 ring-blue-500/20"
              )}
            >
              {/* Left Color Accent Bar */}
              <div 
                className={cn(
                  "absolute left-0 top-0 bottom-0 w-1.5",
                  isSuccess && "bg-gradient-to-b from-emerald-400 to-teal-500",
                  isError && "bg-gradient-to-b from-red-500 to-rose-600",
                  isWarning && "bg-gradient-to-b from-amber-400 to-yellow-500",
                  t.type === 'info' && "bg-gradient-to-b from-blue-400 to-indigo-500"
                )}
              />

              {/* Icon */}
              <div className="shrink-0 mt-0.5 ml-1">
                {isSuccess && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                {isError && (
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                    <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                {isWarning && (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                {t.type === 'info' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                    <Info className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    isSuccess && "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                    isError && "bg-red-500/10 text-red-400 border-red-500/30",
                    isWarning && "bg-amber-500/10 text-amber-400 border-amber-500/30",
                    t.type === 'info' && "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  )}>
                    {t.title || (isSuccess ? 'Success' : isError ? 'Action Error' : isWarning ? 'Warning' : 'Info')}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-100 leading-snug whitespace-pre-wrap break-words">
                  {t.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
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
