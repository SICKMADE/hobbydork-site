'use client';

import { useAuth } from '@/lib/auth';
import AuthComponent from '@/components/auth/AuthComponent';
import Dashboard from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, logout } = useAuth();

  if (!user) {
    return <AuthComponent />;
  }

  if (user.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
        <Button onClick={logout} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  return <Dashboard />;
}
