'use client';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const { logout, profile, loading: isProfileLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until both user and profile loading is complete
    if (isUserLoading || isProfileLoading) {
      return;
    }

    // If no user, redirect to the root/login page
    if (!user) {
      router.replace('/');
      return;
    }

    // If a user and profile are loaded, check for onboarding completion
    if (profile && !profile.storeId && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [user, profile, isUserLoading, isProfileLoading, pathname, router]);

  // Unified loading state
  if (isUserLoading || isProfileLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // If we are still here and there's no user, show a redirecting message
  // while the effect cleans up.
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
  }
  
  // If a profile exists but onboarding is not complete, show a message while redirecting.
  // This also allows the onboarding page itself to render.
  if (profile && !profile.storeId) {
    if (pathname === '/onboarding') {
        return <>{children}</>;
    }
    return <div className="flex items-center justify-center h-screen">Redirecting to onboarding...</div>;
  }

  if (profile?.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
         <Button onClick={() => logout()} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  // If user is fully loaded, onboarded, and not suspended, show the app content.
  if (user && profile && profile.storeId) {
    return <>{children}</>;
  }

  // Fallback loading state
  return <div className="flex items-center justify-center h-screen">Loading...</div>;
}
