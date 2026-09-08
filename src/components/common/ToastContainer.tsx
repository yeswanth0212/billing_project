import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useBilling } from '../../context/BillingContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useBilling();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let bgClass = 'bg-slate-900 border-slate-700 text-white';
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

        if (toast.type === 'success') {
          bgClass = 'bg-emerald-950/95 border-emerald-700 text-emerald-100 shadow-emerald-950/50';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'error') {
          bgClass = 'bg-rose-950/95 border-rose-700 text-rose-100 shadow-rose-950/50';
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all transform animate-in slide-in-from-bottom-3 duration-200 ${bgClass}`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span className="text-xs font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
