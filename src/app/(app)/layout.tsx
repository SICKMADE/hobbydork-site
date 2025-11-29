'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    // Redirect to onboarding if user is active but has no storeId yet
    if (profile?.status === 'ACTIVE' && !profile.storeId) {
      router.push('/onboarding');
    }
  }, [profile, router]);


  if (isUserLoading || isProfileLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    // This will be briefly shown before the redirect happens
    return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
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
  
  // Do not render children if user is active but not onboarded yet, as they will be redirected.
  if (profile?.status === 'ACTIVE' && !profile.storeId) {
    return <div className="flex items-center justify-center h-screen">Redirecting to onboarding...</div>;
  }

  return <>{children}</>;
}
