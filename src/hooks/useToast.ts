/**
 * useToast — a tiny toast notification store.
 *
 * Provides an imperative `push()` plus the reactive list of active toasts.
 * Toasts auto-dismiss after a timeout and can be dismissed manually.
 */

import { useCallback, useState } from 'react';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = 'info', ttl = 3200) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, kind, message }]);
      if (ttl > 0) {
        window.setTimeout(() => dismiss(id), ttl);
      }
      return id;
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
