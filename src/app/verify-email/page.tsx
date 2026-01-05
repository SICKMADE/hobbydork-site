'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const { user, logout, resendVerification, refreshIdToken } = useAuth();
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [checkMsg, setCheckMsg] = useState<string>('');

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
          Please check your inbox and click the link to verify your email address.<br />
          <span className="font-medium text-primary">After verifying, click the button below to check your status. You do not need to log out.</span>
        </p>

        <div className="mt-8 flex flex-col gap-4 items-center">
          <Button
            variant="default"
            size="lg"
            className="w-full font-semibold text-base"
            onClick={async () => {
              setCheckStatus('loading');
              setCheckMsg('');
              try {
                await refreshIdToken();
                window.location.reload();
              } catch (e: any) {
                setCheckStatus('error');
                let errorText = 'Could not check verification.';
                if (e?.message) {
                  errorText = `Error: ${e.message}`;
                } else if (typeof e === 'string') {
                  errorText = `Error: ${e}`;
                } else if (e && e.toString) {
                  errorText = `Error: ${e.toString()}`;
                }
                setCheckMsg(errorText);
              }
            }}
            disabled={checkStatus === 'loading'}
          >
            {checkStatus === 'loading' ? <Loader2 className="animate-spin h-4 w-4" /> : null}
            {checkStatus === 'loading' ? 'Checking…' : 'Check verification'}
          </Button>
          {checkStatus === 'success' && (
            <div className="mt-2 text-green-700 text-sm animate-fade-in-slow">{checkMsg}</div>
          )}
          {checkStatus === 'error' && (
            <div className="mt-2 text-red-700 text-sm animate-fade-in-slow">{checkMsg}</div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 items-center">
          <Button variant="outline" onClick={logout}>
            Log out
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Need help? <a href="mailto:hobbydorkapp@gmail.com" className="underline text-blue-700">Contact support</a>.
        </p>
      </div>
    </div>
  );
}