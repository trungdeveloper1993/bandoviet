import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Info, Trash2 } from 'lucide-react';

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  tone?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  /** Optional middle action, e.g. "Gộp thêm" next to "Thay thế" */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Alert mode: a single acknowledgement button */
  alertOnly?: boolean;
  onConfirm?: () => void;
}

interface ConfirmDialogProps {
  options: ConfirmOptions | null;
  onClose: () => void;
}

const TONES = {
  danger: {
    icon: <Trash2 className="w-5 h-5" />,
    iconBox: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    iconBox: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    iconBox: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
    button: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ options, onClose }) => {
  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, onClose]);

  const tone = TONES[options?.tone ?? 'info'];

  return (
    <AnimatePresence>
      {options && (
        <div className="fixed inset-0 z-[110000] flex items-end sm:items-center justify-center p-4 print:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10"
          >
            <div className="flex items-start gap-3.5">
              <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${tone.iconBox}`}>
                {tone.icon}
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 id="confirm-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {options.title}
                </h3>
                <div className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {options.message}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              {!options.alertOnly && (
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                >
                  {options.cancelLabel ?? 'Hủy'}
                </button>
              )}
              {options.secondaryLabel && options.onSecondary && (
                <button
                  onClick={() => {
                    options.onSecondary?.();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 transition"
                >
                  {options.secondaryLabel}
                </button>
              )}
              <button
                autoFocus
                onClick={() => {
                  options.onConfirm?.();
                  onClose();
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition ${tone.button}`}
              >
                {options.confirmLabel ?? (options.alertOnly ? 'Đã hiểu' : 'Đồng ý')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
