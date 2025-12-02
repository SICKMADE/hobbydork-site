'use client';

import AuthComponent from '@/components/auth/AuthComponent';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Logo from '@/components/Logo';

function HomePageContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 -mt-20">
      <div className="text-center mb-8">
        <Logo className="justify-center" />
      </div>

      <div className="w-full max-w-2xl relative">
        <div 
          className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-lg opacity-75 animate-pulse"
        />
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search for any collectible, comic, or card..."
                className="w-full h-16 pl-12 pr-4 rounded-full text-lg bg-card border-2 border-border focus:ring-primary"
            />
        </div>
      </div>
       <p className="text-center text-muted-foreground mt-8">Your new destination for buying and selling collectibles.</p>
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
    <HomePageContent />
  );
}
