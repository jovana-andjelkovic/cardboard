import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmPopoverProps {
  anchor: DOMRect;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmPopover = ({
  anchor,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: ConfirmPopoverProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const top = anchor.bottom + 6;
  const right = window.innerWidth - anchor.right;

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onCancel} />
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-56"
        style={{ top, right }}
      >
        <p className="text-xs text-gray-600 mb-3 leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="btn-secondary px-2.5 py-1 text-xs font-medium rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-secondary px-2.5 py-1 text-xs font-medium rounded text-red-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
};
