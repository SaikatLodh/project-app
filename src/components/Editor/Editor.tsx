'use client';

import { useSync } from './SyncProvider';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import { useState, useCallback } from 'react';
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Undo, Redo, Minus,
} from 'lucide-react';

export function Editor({ isReadonly = false }: { isReadonly?: boolean }) {
  const { ydoc } = useSync();

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          // @ts-ignore — history must be disabled when Yjs manages undo/redo
          history: false,
        }),
        ...(ydoc
          ? [
            Collaboration.configure({
              document: ydoc,
            }),
          ]
          : []),
      ],
      editorProps: {
        attributes: {
          class:
            'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[60vh] px-2 py-4 leading-relaxed',
        },
      },
      editable: !isReadonly,
      immediatelyRender: false,
    },
    [ydoc]
  );

  const btn = useCallback(
    (active: boolean) =>
      `p-1.5 rounded transition-colors cursor-pointer ${active
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
      }`,
    []
  );

  if (!editor || !ydoc) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400 dark:text-gray-500 text-sm">
          Loading editor…
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Toolbar */}
      {!isReadonly && (
        <div className="flex flex-wrap items-center gap-0.5 mb-4 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {/* History */}
        <button title="Undo" onClick={() => editor.chain().focus().undo().run()} className={btn(false)}>
          <Undo className="w-4 h-4" />
        </button>
        <button title="Redo" onClick={() => editor.chain().focus().redo().run()} className={btn(false)}>
          <Redo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Headings */}
        <button title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))}>
          <Heading1 className="w-4 h-4" />
        </button>
        <button title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}>
          <Heading2 className="w-4 h-4" />
        </button>
        <button title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))}>
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Inline formatting */}
        <button title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>
          <Bold className="w-4 h-4" />
        </button>
        <button title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>
          <Italic className="w-4 h-4" />
        </button>
        <button title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))}>
          <Strikethrough className="w-4 h-4" />
        </button>
        <button title="Inline Code" onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive('code'))}>
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Lists */}
        <button title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>
          <List className="w-4 h-4" />
        </button>
        <button title="Ordered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <button title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))}>
          <Quote className="w-4 h-4" />
        </button>
        <button title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)}>
          <Minus className="w-4 h-4" />
        </button>
      </div>
      )}

      {/* Editor surface */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-6 py-4 min-h-[60vh]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
