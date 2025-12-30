'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function VerifyEmailPage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">

        {/* LOGO */}
        <div className="mb-6 flex justify-center">
          <div className="relative h-24 w-24">
            <Image
              src="/hobbydork-head.png"
              alt="HobbyDork"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="text-2xl font-semibold">Verify your email</h1>

        <p className="mt-4 text-sm text-muted-foreground">
          We sent a verification link to:
          <br />
          <strong>{user?.email ?? 'your email address'}</strong>
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Click the link in your email to activate your account.
        </p>

        <div className="mt-6">
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          After verifying, log back in to continue.
        </p>
      </div>
    </div>
  );
}