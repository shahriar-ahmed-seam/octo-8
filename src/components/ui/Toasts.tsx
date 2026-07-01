/**
 * Toasts — fixed-position stack of transient notifications.
 */

import type { Toast } from '../../hooks/useToast';
import Icon from './Icon';

interface ToastsProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export default function Toasts({ toasts, onDismiss }: ToastsProps) {
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <Icon name="close" size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
