import { useEffect } from 'react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-xl font-semibold mb-3 ${destructive ? 'text-red-600' : 'text-bluebook-900'}`}>
          {title}
        </h2>
        <p className="text-body text-bluebook-600 mb-7 leading-relaxed">{message}</p>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          {destructive ? (
            <button
              onClick={onConfirm}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-medium gap-2 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? 'Deleting...' : confirmLabel}
            </button>
          ) : (
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? 'Working...' : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
