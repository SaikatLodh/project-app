'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

interface Props {
  documentTitle: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteDocumentModal({ documentTitle, onConfirm, onClose }: Props) {
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, loading]);

  const handleDelete = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => !loading && e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-base font-semibold">Delete Document</h2>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                This action is permanent
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
                &ldquo;{documentTitle}&rdquo; and all its version history will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
