import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastOptions {
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
  /** ms before auto-dismiss (defaults: 3.2s, or 6s when there is an action) */
  duration?: number;
}

/** Small toast queue (max 3 visible) with auto-dismiss. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      const item: ToastItem = {
        id,
        message,
        tone: options.tone ?? 'success',
        actionLabel: options.actionLabel,
        onAction: options.onAction,
      };
      setToasts((list) => [...list.slice(-2), item]);
      const duration = options.duration ?? (options.onAction ? 6000 : 3200);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => window.clearTimeout(t));
  }, []);

  return { toasts, show, dismiss };
}
