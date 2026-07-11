import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { TokenRefresher } from '@/components/Auth/TokenRefresher';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CollabDocs — Real-time Collaborative Editor',
  description: 'A local-first collaborative document editor with offline sync and version history.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
      >
        <TokenRefresher />
        {children}
      </body>
    </html>
  );
}
