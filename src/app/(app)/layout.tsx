'use client';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is resolved.
    }

    if (!user) {
      router.replace('/'); // Not logged in, go to auth page.
      return;
    }
    
    // Check if the user has completed the basic onboarding (agreements)
    const needsGlobalOnboarding = profile && (!profile.oneAccountAcknowledged || !profile.goodsAndServicesAgreed);
    
    if (needsGlobalOnboarding && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }

    // If user has completed agreements but lands on onboarding, send to dashboard.
    if (profile && !needsGlobalOnboarding && pathname === '/onboarding') {
        router.replace('/');
        return;
    }

  }, [user, profile, loading, pathname, router]);

  // While loading, show a full-screen loader.
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  const needsGlobalOnboarding = profile && (!profile.oneAccountAcknowledged || !profile.goodsAndServicesAgreed);
  
  if (needsGlobalOnboarding) {
    if (pathname === '/onboarding') {
      return <>{children}</>;
    } else {
      return <div className="flex items-center justify-center h-screen">Redirecting to onboarding...</div>;
    }
  }

  // Handle suspended users.
  if (profile?.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
         <Button onClick={() => {
             const authModule = require('firebase/auth');
             const { initializeFirebase } = require('@/firebase');
             const { auth } = initializeFirebase();
             authModule.signOut(auth).then(() => window.location.href = '/');
         }} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  // If we've passed all checks, render the main application content.
  if (user && profile) {
    return <>{children}</>;
  }

  // Fallback loading state for any other transitional conditions.
  return <div className="flex items-center justify-center h-screen">Loading application...</div>;
}

    