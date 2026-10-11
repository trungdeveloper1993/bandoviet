import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { ToastItem } from '../hooks/useToasts';

interface ToasterProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

const ICONS = {
  success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 dark:text-emerald-600 shrink-0" />,
  info: <Info className="w-4.5 h-4.5 text-sky-400 dark:text-sky-600 shrink-0" />,
  error: <AlertTriangle className="w-4.5 h-4.5 text-rose-400 dark:text-rose-600 shrink-0" />,
};

/** Stacked toasts: above the bottom nav on phones, bottom-right on desktop. */
export const Toaster: React.FC<ToasterProps> = ({ toasts, onDismiss }) => (
  <div
    aria-live="polite"
    className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] lg:bottom-6 lg:left-auto lg:right-6 z-[120000] flex flex-col items-center lg:items-end gap-2 px-4 pointer-events-none print:hidden"
  >
    <AnimatePresence initial={false}>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          layout
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto w-full max-w-sm flex items-center gap-3 rounded-2xl bg-slate-900/95 text-white dark:bg-white dark:text-slate-900 shadow-xl shadow-slate-900/20 ring-1 ring-white/10 dark:ring-slate-900/5 pl-3.5 pr-2 py-2.5 backdrop-blur"
        >
          {ICONS[t.tone]}
          <p className="flex-1 text-[13px] font-medium leading-snug">{t.message}</p>
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction?.();
                onDismiss(t.id);
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg text-[13px] font-bold text-indigo-300 hover:bg-white/10 dark:text-indigo-600 dark:hover:bg-indigo-50 transition"
            >
              {t.actionLabel}
            </button>
          )}
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 dark:text-slate-400 dark:hover:text-slate-700 dark:hover:bg-slate-100 transition"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

export default Toaster;
