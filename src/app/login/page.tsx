'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthComponent from '@/components/auth/AuthComponent';
import { useUser } from '@/firebase';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();

  const [initialTab, setInitialTab] = useState<'login' | 'signup'>('login');
  const [showVerifyMsg, setShowVerifyMsg] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sync = () => {
      setInitialTab(window.location.hash === '#signup' ? 'signup' : 'login');
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    if (searchParams?.get('verify') === '1') {
      setShowVerifyMsg(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (user.emailVerified) {
        router.replace('/');
      } else {
        router.replace('/login?verify=1');
      }
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  if (user) return null;

  return (
    <>
      {showVerifyMsg && (
        <div className="mb-4 mx-auto max-w-md rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-center text-sm text-yellow-900">
          Please verify your email. Check your inbox, then log in.
        </div>
      )}
      <AuthComponent initialTab={initialTab} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
