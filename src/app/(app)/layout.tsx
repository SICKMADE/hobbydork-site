'use client';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

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
    // If done loading and there's no user, go to login screen
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // If the profile is loaded and the user's status is ACTIVE but they have no storeId,
    // they need to be onboarded. Redirect them unless they are already there.
    if (profile && profile.status === 'ACTIVE' && !profile.storeId && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [profile, pathname, router]);

  if (isUserLoading || isProfileLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    // This will be briefly shown before the redirect happens from the effect above
    return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
  }
  
  if (profile?.status === 'LIMITED') {
    return (
       <div className="flex items-center justify-center h-screen">
          <Alert variant="default" className="max-w-lg">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Verify Your Email</AlertTitle>
            <AlertDescription>
              A verification email has been sent to your inbox. Please check your email and click the verification link to continue.
            </AlertDescription>
            <div className="mt-4">
              <Button onClick={() => logout()}>Logout</Button>
            </div>
          </Alert>
      </div>
    )
  }
  
  // If the user has no storeId but is on the onboarding page, allow it.
  if (profile?.status === 'ACTIVE' && !profile.storeId && pathname === '/onboarding') {
    return <>{children}</>;
  }
  
  // If user has no storeId and is NOT on onboarding, show a loading/redirecting state
  // while the effect above does its work.
  if (profile?.status === 'ACTIVE' && !profile.storeId) {
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

  // If user is logged in, has a store, and is not suspended, show the app.
  return <>{children}</>;
}
