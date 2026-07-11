'use client';

import { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

interface Props {
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export function LogoutModal({ onConfirm, onClose, isLoading }: Props) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && !isLoading && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, isLoading]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => !isLoading && e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sign out</h2>
          </div>
          {!isLoading && (
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to sign out? Any unsaved changes will be lost.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing out…
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sign out
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
