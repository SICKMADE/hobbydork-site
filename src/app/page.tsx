'use client';

import { useAuth } from '@/lib/auth';
import AuthComponent from '@/components/auth/AuthComponent';
import Dashboard from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import AppRoutesLayout from './(app)/layout';

export default function Home() {
  const { user } = useAuth();

  if (!user) {
    return <AuthComponent />;
  }

  if (user.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
        <Button onClick={() => {
          // In a real app, you would call a logout function.
          // For now, we clear localStorage and reload.
          localStorage.removeItem('vaultverse-user');
          window.location.reload();
        }} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  // All authenticated users (ACTIVE, LIMITED) are wrapped in the App layout
  return (
    <AppRoutesLayout>
      <Dashboard />
    </AppRoutesLayout>
  );
}
