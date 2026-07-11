'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

export function ShareButton({ documentId }: { documentId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
        title="Share this document"
      >
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {isOpen && (
        <ShareModal documentId={documentId} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
