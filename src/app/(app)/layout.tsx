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
      return; // Don't do anything while auth state is resolving
    }

    // If there's no user, they should be redirected to the login page.
    // This is handled by the root page logic, but as a fallback:
    if (!user) {
      router.replace('/');
      return;
    }

    // This is the key logic based on your instructions.
    // A new user has a profile but is missing a storeId.
    const needsOnboarding = profile && !profile.storeId;
    
    // If onboarding is needed and we are NOT on the onboarding page, redirect.
    if (needsOnboarding && pathname !== '/onboarding') {
      router.replace('/onboarding');
      return; // Stop further execution
    }

    // If a user has completed onboarding (has a storeId) but somehow lands on the onboarding page,
    // redirect them to the dashboard.
    if (profile && profile.storeId && pathname === '/onboarding') {
        router.replace('/');
        return;
    }

  }, [user, profile, loading, pathname, router]);

  // Display a loading indicator while auth state is being determined.
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // If the user is logged in but their profile is still loading, or if they need onboarding,
  // we render children only for the '/onboarding' page, otherwise show a redirecting message.
  // This prevents the main app layout from flashing before the redirect happens.
  const needsOnboarding = profile && !profile.storeId;
  if (needsOnboarding) {
      if (pathname === '/onboarding') {
          return <>{children}</>;
      }
      return <div className="flex items-center justify-center h-screen">Redirecting to onboarding...</div>;
  }
  
  // Handle suspended users
  if (profile?.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
         <Button onClick={() => {
             // We need access to the logout function here. Let's assume a full-page reload after logout is fine.
             // A better implementation would have logout available globally without the full useAuth context if needed.
             // For now, this is a simple solution.
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

  // If the user is authenticated and has completed onboarding, render the main app content.
  if (user && profile && profile.storeId) {
    return <>{children}</>;
  }

  // Fallback for any other edge cases while redirecting.
  return <div className="flex items-center justify-center h-screen">Loading application...</div>;
}
