import type { Metadata } from 'next';
import './globals.css';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthProvider } from '@/hooks/use-auth';
import SignedOutGate from '@/components/auth/SignedOutGate';
import EmailVerificationGate from '@/components/auth/EmailVerificationGate';
import { CartProvider } from '@/hooks/use-cart';
import { VaultProvider } from '@/lib/vault';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = {
  title: 'HobbyDork',
  description: 'Your personal vault for amazing collectibles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AuthProvider>
            <SignedOutGate />
            <EmailVerificationGate>
              <CartProvider>
                <VaultProvider>
                  <SidebarProvider>
                    {children}
                  </SidebarProvider>
                  <Toaster />
                </VaultProvider>
              </CartProvider>
            </EmailVerificationGate>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
