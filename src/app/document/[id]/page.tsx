import { SyncProvider } from '@/components/Editor/SyncProvider';
import { Editor } from '@/components/Editor/Editor';
import { ConnectionStatus } from '@/components/Editor/ConnectionStatus';
import { EditableTitle } from '@/components/Editor/EditableTitle';
import { VersionSidebar } from '@/components/VersionHistory/VersionSidebar';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import dbConnect from '@/lib/db';
import { DocumentModel } from '@/models/Document';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUserFromCookies } from '@/lib/auth';
import { ShareButton } from '@/components/Document/ShareButton';

export default async function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let doc: any = null;
  try {
    await dbConnect();
    doc = await DocumentModel.findById(id).lean();
  } catch (err) {
    console.error('DB error on document page:', err);
  }

  if (!doc) {
    notFound();
  }

  const currentUser = await getCurrentUserFromCookies();
  if (!currentUser) {
    redirect('/login');
  }

  let userRole: 'owner' | 'editor' | 'viewer' | null = null;
  
  if (doc.owner?.toString() === currentUser.id) {
    userRole = 'owner';
  } else {
    const collaborator = doc.collaborators?.find(
      (c: any) => c.user?.toString() === currentUser.id
    );
    if (collaborator) {
      userRole = collaborator.role;
    }
  }

  // If user is not the owner and not a collaborator, deny access
  if (!userRole) {
    // You could redirect to a 403 Forbidden page, or just dashboard
    redirect('/'); 
  }

  const isReadonly = userRole === 'viewer';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <SyncProvider documentId={id}>
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <EditableTitle
              documentId={id}
              initialTitle={(doc as any).title ?? 'Untitled'}
              isReadonly={isReadonly}
            />
          </div>
          <div className="flex items-center gap-3">
            {userRole === 'owner' && <ShareButton documentId={id} />}
            <ConnectionStatus />
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor area */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <Editor isReadonly={isReadonly} />
          </div>
          {/* Version sidebar */}
          <VersionSidebar documentId={id} isReadonly={isReadonly} />
        </div>
      </SyncProvider>
    </div>
  );
}
