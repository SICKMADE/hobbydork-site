import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { VaultProvider } from '@/lib/vault';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'VaultVerse',
  description: 'Your personal vault for amazing collectibles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <VaultProvider>
            {children}
            <Toaster />
          </VaultProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
