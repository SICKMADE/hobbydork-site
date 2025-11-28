'use client';

import { useAuth } from '@/lib/auth';
import AuthComponent from '@/components/auth/AuthComponent';
import Dashboard from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import AppLayout from './(app)/layout';

export default function Home() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <AuthComponent />;
  }

  if (user.status === 'SUSPENDED') {
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

  // All other authenticated users (ACTIVE, LIMITED) are shown the main app content.
  // The AppLayout and its children will handle role-specific UI.
  return (
      <Dashboard />
  );
}
