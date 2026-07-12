'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  documentId: string;
  initialTitle: string;
  isReadonly?: boolean;
}

export function EditableTitle({ documentId, initialTitle, isReadonly }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    if (isReadonly) return;
    setDraft(title);
    setError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(title);
    setError('');
  };

  const saveTitle = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError('Title cannot be empty.');
      return;
    }
    if (trimmed === title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update title.');
      setTitle(trimmed);
      setEditing(false);
      toast.success('Document renamed successfully');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') cancelEditing();
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            maxLength={120}
            disabled={saving}
            className="text-sm font-semibold bg-transparent border-b-2 border-indigo-500 focus:outline-none px-0.5 min-w-0 w-48 sm:w-64 text-gray-900 dark:text-gray-100 disabled:opacity-60"
            aria-label="Edit document title"
          />
          {/* Save */}
          <button
            onClick={saveTitle}
            disabled={saving}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 transition-colors cursor-pointer"
            aria-label="Save title"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>
          {/* Cancel */}
          {!saving && (
            <button
              onClick={cancelEditing}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Cancel editing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-500 pl-0.5">{error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={startEditing}
      className={`group flex items-center gap-1.5 min-w-0 text-left ${isReadonly ? 'cursor-default' : 'cursor-pointer'}`}
      title={isReadonly ? 'Read-only' : 'Click to rename'}
      aria-label={`Document title: ${title}`}
      disabled={isReadonly}
    >
      <span className={`text-sm font-semibold truncate max-w-[12rem] sm:max-w-xs transition-colors ${!isReadonly && 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
        {title}
      </span>
      {!isReadonly && <Pencil className="w-3 h-3 flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </button>
  );
}
