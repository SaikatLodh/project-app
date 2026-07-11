'use client';

import { useSync } from './SyncProvider';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export function ConnectionStatus() {
  const { status } = useSync();

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
        status === 'connected'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : status === 'syncing'
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      }`}
      role="status"
      aria-live="polite"
    >
      {status === 'connected' && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Saved
        </>
      )}
      {status === 'syncing' && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Syncing…
        </>
      )}
      {status === 'offline' && (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          Offline
        </>
      )}
    </div>
  );
}
