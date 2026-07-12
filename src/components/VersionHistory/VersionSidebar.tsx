'use client';

import { useEffect, useState } from 'react';
import { useSync } from '../Editor/SyncProvider';
import { format } from 'date-fns';
import { History, Save, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import * as Y from 'yjs';
import toast from 'react-hot-toast';

interface Version {
  _id: string;
  name: string;
  createdAt: string;
  content: { data: number[] };
}

interface Props {
  documentId: string;
  isReadonly?: boolean;
}

export function VersionSidebar({ documentId, isReadonly = false }: Props) {
  const { ydoc, status } = useSync();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      const data = await res.json();
      setVersions(data.versions ?? []);
    } catch (e) {
      console.error('Failed to fetch versions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const saveVersion = async () => {
    if (!ydoc || status === 'offline') return;
    const name = prompt('Name this version:', `Snapshot ${new Date().toLocaleTimeString()}`);
    if (!name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await fetchVersions();
        toast.success('Version saved successfully');
      }
    } catch (e) {
      console.error('Failed to save version', e);
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = (content: { data: number[] }) => {
    if (!ydoc) return;
    if (!confirm('Restore this version? The current content will be overwritten for all collaborators.')) return;
    const update = new Uint8Array(content.data);
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, update);
    
    ydoc.transact(() => {
      const currentFragment = ydoc.getXmlFragment('default');
      currentFragment.delete(0, currentFragment.length);
      const oldFragment = tempDoc.getXmlFragment('default');
      const cloned = oldFragment.toArray().map(item => item.clone()) as (Y.XmlElement | Y.XmlText)[];
      currentFragment.insert(0, cloned);
    });
  };

  return (
    <aside
      className={`flex-shrink-0 flex flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-200 ${
        isOpen ? 'w-64' : 'w-10'
      }`}
    >
      {/* Toggle + Title */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 dark:border-gray-800">
        {isOpen && (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <History className="w-4 h-4 text-indigo-500" />
            Version History
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <>
          {/* Save button */}
          {!isReadonly && (
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={saveVersion}
              disabled={saving || status === 'offline'}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving…' : 'Save Snapshot'}
            </button>
            {status === 'offline' && (
              <p className="text-center text-xs text-gray-400 mt-2">Connect to save versions</p>
            )}
          </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-8 leading-relaxed">
                No snapshots yet.<br />Save one to track your progress.
              </p>
            ) : (
              versions.map((v) => (
                <div
                  key={v._id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                  <p className="text-xs font-medium truncate mb-0.5">{v.name}</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {format(new Date(v.createdAt), 'MMM d · h:mm a')}
                  </p>
                  {!isReadonly && (
                  <button
                    onClick={() => restoreVersion(v.content)}
                    className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </aside>
  );
}
