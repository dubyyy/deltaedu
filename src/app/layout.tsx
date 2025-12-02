// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeltaEDU - AI-Powered Learning for Delta State',
  description: 'Transform your study materials into interactive learning experiences with AI. Built for students in Delta State, Nigeria.',
  keywords: ['education', 'AI', 'learning', 'Delta State', 'Nigeria', 'WAEC', 'JAMB'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AnalyticsProvider>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
