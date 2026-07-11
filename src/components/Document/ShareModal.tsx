'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, UserPlus, Loader2, Trash2 } from 'lucide-react';

interface Collaborator {
  user: {
    _id: string;
    email: string;
    fullName: string;
    profilePicture?: { url: string };
  };
  role: 'editor' | 'viewer';
}

interface Props {
  documentId: string;
  onClose: () => void;
}

export function ShareModal({ documentId, onClose }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [error, setError] = useState('');

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`);
      const data = await res.json();
      if (res.ok) {
        setCollaborators(data.collaborators || []);
      } else {
        setError(data.error || 'Failed to load collaborators.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    
    setAdding(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add collaborator.');
      }
      
      setEmail('');
      setRole('viewer');
      await fetchCollaborators();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (emailToRemove: string) => {
    setError('');
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToRemove }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove collaborator.');
      }
      
      await fetchCollaborators();
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={adding}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
              disabled={adding}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
            </select>
            <button
              type="submit"
              disabled={adding || !email.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
            </button>
          </form>

          {/* List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">People with access</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No collaborators yet.
              </p>
            ) : (
              collaborators.map((c) => (
                <div key={c.user._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                      {c.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {c.user.fullName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {c.user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs font-medium px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {c.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                    <button
                      onClick={() => handleRemove(c.user.email)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                      title="Remove access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
