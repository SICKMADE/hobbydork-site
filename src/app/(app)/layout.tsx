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
    
    // Once user and profile are loaded, check for onboarding.
    if (profile && !profile.storeId && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return;
    }

    // If user is onboarded but lands on the onboarding page, send to dashboard.
    if (profile && profile.storeId && pathname === '/onboarding') {
        router.replace('/');
        return;
    }

  }, [user, profile, loading, pathname, router]);

  // While loading, show a full-screen loader.
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If user is logged in but profile is still resolving, it's covered by `loading` state.
  // The useEffect will handle the redirect once `loading` is false.
  
  // Define the condition for needing onboarding.
  const needsOnboarding = user && profile && !profile.storeId;
  
  // If the user needs onboarding, we must block the main app from rendering
  // unless they are on the onboarding page itself.
  if (needsOnboarding) {
    if (pathname === '/onboarding') {
      // Allow the onboarding page to render.
      return <>{children}</>;
    } else {
      // For any other page, show a redirecting message and wait for useEffect to fire.
      // This prevents the dashboard or other pages from flashing.
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

  // If we've passed all checks (user is logged in, profile is loaded, and they have a storeId),
  // then render the main application content.
  if (user && profile && profile.storeId) {
    return <>{children}</>;
  }

  // Fallback loading state for any other transitional conditions.
  return <div className="flex items-center justify-center h-screen">Loading application...</div>;
}
