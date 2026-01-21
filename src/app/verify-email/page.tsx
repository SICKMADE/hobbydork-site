"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, logout, resendVerification } = useAuth();
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

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
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={async () => {
              setResendStatus('loading');
              setErrorMsg('');
              try {
                if (!resendVerification) throw new Error('Resend verification is not available.');
                await resendVerification();
                setResendStatus('success');
              } catch (e: any) {
                setResendStatus('error');
                setErrorMsg(getFriendlyErrorMessage(e) || 'Could not resend verification email.');
              }
            }}
            disabled={resendStatus === 'loading'}
            className="flex items-center justify-center gap-2"
          >
            {resendStatus === 'loading' ? <Loader2 className="animate-spin h-4 w-4" /> : null}
            {resendStatus === 'loading' ? 'Resending…' : 'Resend verification email'}
          </Button>
          {resendStatus === 'success' && (
            <div className="mt-2 text-green-700 text-sm animate-fade-in-slow">Verification email sent!</div>
          )}
          {resendStatus === 'error' && (
            <div className="mt-2 text-red-700 text-sm animate-fade-in-slow">{errorMsg}</div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 items-center">
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
          <Button
            variant="ghost"
            className="text-xs text-blue-700 mt-2"
            onClick={() => window.location.href = 'mailto:hobbydorkapp@gmail.com'}
          >
            Help
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          After verifying, log back in to continue.
        </p>
      </div>
    </div>
  );
}
