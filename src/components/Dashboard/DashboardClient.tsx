'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, Clock, Trash2, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { NewDocumentModal } from './NewDocumentModal';
import { DeleteDocumentModal } from './DeleteDocumentModal';
import { LogoutModal } from './LogoutModal';

interface Doc {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  owner: string | null;
}

interface Props {
  initialDocuments: Doc[];
  currentUserId: string | null;
}

export function DashboardClient({ initialDocuments, currentUserId }: Props) {
  const router = useRouter();
  const [documents, setDocuments] = useState<Doc[]>(initialDocuments);
  const [showNewModal, setShowNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/documents/${deleteTarget._id}`, { method: 'DELETE' });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d._id !== deleteTarget._id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Modals */}
      {showNewModal && <NewDocumentModal onClose={() => setShowNewModal(false)} />}
      {deleteTarget && (
        <DeleteDocumentModal
          documentTitle={deleteTarget.title || 'Untitled'}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {showLogoutModal && (
        <LogoutModal
          isLoading={isLoggingOut}
          onConfirm={handleLogout}
          onClose={() => !isLoggingOut && setShowLogoutModal(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">CollabDocs</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="new-document-btn"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Document
            </button>
            <button
              id="logout-btn"
              onClick={() => setShowLogoutModal(true)}
              disabled={isLoggingOut}
              title="Logout"
              className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium px-3 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Your Documents</h1>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No documents yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              Create your first document to start writing and collaborating offline or online.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md transition-all"
              >
                {/* Delete button — owner only */}
                {doc.owner === currentUserId && (
                  <button
                    id={`delete-doc-${doc._id}`}
                    onClick={(e) => { e.preventDefault(); setDeleteTarget(doc); }}
                    className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
                    aria-label={`Delete ${doc.title}`}
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <Link
                  href={`/document/${doc._id}`}
                  className="flex items-start gap-3 p-5 flex-1"
                >
                  <div className="w-9 h-9 flex-shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                    <FileText className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="min-w-0 pr-6">
                    <p className="font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {doc.title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(doc.updatedAt), 'MMM d, yyyy')}
                      </p>
                      {doc.owner !== currentUserId && (
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-medium">
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
