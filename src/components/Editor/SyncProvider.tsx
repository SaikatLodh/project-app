'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { io, Socket } from 'socket.io-client';

interface SyncContextType {
  ydoc: Y.Doc | null;
  status: 'offline' | 'syncing' | 'connected';
  socket: Socket | null;
}

const SyncContext = createContext<SyncContextType>({
  ydoc: null,
  status: 'offline',
  socket: null,
});

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ documentId, children }: { documentId: string; children: ReactNode }) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [status, setStatus] = useState<'offline' | 'syncing' | 'connected'>('offline');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    setYdoc(doc);

    // 1. Setup Local Persistence (IndexedDB) for Offline-first
    const provider = new IndexeddbPersistence(documentId, doc);

    provider.on('synced', () => {
      console.log('Local IndexedDB synced');
    });

    // 2. Setup WebSocket Sync Engine
    const newSocket = io({
      query: { documentId }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setStatus('offline');
    });

    newSocket.on('sync-step-1', (stateVectorBuffer: ArrayBuffer) => {
      setStatus('syncing');
      const stateVector = new Uint8Array(stateVectorBuffer);
      const update = Y.encodeStateAsUpdate(doc, stateVector);
      newSocket.emit('sync-step-2', update);
    });

    newSocket.on('sync-step-2', (updateBuffer: ArrayBuffer) => {
      const update = new Uint8Array(updateBuffer);
      Y.applyUpdate(doc, update);
      setStatus('connected');
    });

    newSocket.on('sync-update', (updateBuffer: ArrayBuffer) => {
      const update = new Uint8Array(updateBuffer);
      Y.applyUpdate(doc, update);
    });

    doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'socket' && newSocket.connected) {
        newSocket.emit('sync-update', update);
      }
    });

    return () => {
      provider.destroy();
      newSocket.disconnect();
      doc.destroy();
    };
  }, [documentId]);

  return (
    <SyncContext.Provider value={{ ydoc, status, socket }}>
      {ydoc ? children : <div className="p-4">Loading document context...</div>}
    </SyncContext.Provider>
  );
}
