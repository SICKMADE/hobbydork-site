'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const ALLOWED_WHEN_SIGNED_OUT = new Set([
  '/',
  '/login',
]);

export default function SignedOutGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user && pathname && !ALLOWED_WHEN_SIGNED_OUT.has(pathname)) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  return null;
}
