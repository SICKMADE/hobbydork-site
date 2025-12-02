'use client';

import AuthComponent from '@/components/auth/AuthComponent';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import Logo from '@/components/Logo';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

function HomePageContent() {
    return (
        <div className="flex flex-col items-center justify-center h-full -mt-16">
            <div className="w-full max-w-xl text-center">
                 <Logo className="justify-center mb-2" />
                 <h1 className="text-4xl font-bold tracking-tighter mb-6">HOBBYDORK</h1>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search collectibles..."
                        className="w-full h-14 pl-12 text-lg bg-card border-2 border-border"
                    />
                </div>
            </div>
        </div>
    );
}


export default function Home() {
  const { user, isUserLoading } = useUser();
  const { logout, profile, loading: isProfileLoading } = useAuth();

  if (isUserLoading || isProfileLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <AuthComponent />;
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
      <HomePageContent />
    </AppLayout>
  );
}
