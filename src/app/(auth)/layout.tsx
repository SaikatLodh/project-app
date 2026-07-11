import Link from 'next/link';
import { FileText } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">CollabDocs</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
