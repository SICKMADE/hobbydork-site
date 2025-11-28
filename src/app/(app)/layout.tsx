'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AuthComponent from '@/components/auth/AuthComponent';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    // This will be briefly shown before the redirect happens
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
  }

  if (user.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
         <Button onClick={() => {
          localStorage.removeItem('vaultverse-user');
          window.location.href = '/';
        }} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }
  
  return <AppLayout>{children}</AppLayout>;
}
