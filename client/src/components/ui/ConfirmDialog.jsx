import { useEffect } from 'react';
import { Button } from './Button.jsx';

/**
 * Confirmation before an action that cannot be undone.
 *
 * Escape closes it and focus is trapped to the dialog's own buttons, so it
 * cannot be dismissed by accident or skipped past with the keyboard.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isBusy = false,
  tone = 'primary',
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) onCancel();
    };

    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind the dialog from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isBusy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={isBusy} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
