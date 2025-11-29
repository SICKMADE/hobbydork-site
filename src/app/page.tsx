'use client';

import AuthComponent from '@/components/auth/AuthComponent';
import Dashboard from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { useUser } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { logout, profile, loading: isProfileLoading } = useAuth();
  const router = useRouter();


  if (isUserLoading || isProfileLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <AuthComponent />;
  }
  
  // If user is active but hasn't completed onboarding, the AppLayout will handle the redirect.
  // We show a loading state here to prevent a flash of the dashboard.
  if (profile?.status === 'ACTIVE' && !profile.storeId) {
     return <div className="flex items-center justify-center h-screen">Redirecting to onboarding...</div>;
  }

  if (profile && profile.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support for assistance.</p>
        <Button onClick={() => logout()} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}
