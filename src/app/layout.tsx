import type { Metadata } from 'next';
import './globals.css';
import { VaultProvider } from '@/lib/vault';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { CartProvider } from '@/hooks/use-cart';

export const metadata: Metadata = {
  title: 'HobbyDork',
  description: 'Your personal vault for amazing collectibles.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Nunito:wght@900&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AuthProvider>
            <CartProvider>
              <VaultProvider>
                {children}
                <Toaster />
              </VaultProvider>
            </CartProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
