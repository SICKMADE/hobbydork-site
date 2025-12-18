'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const ALLOWED_WHEN_SIGNED_OUT = new Set<string>(['/login']);

export default function SignedOutGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If signed out, force everything to /login.
    if (!user && !ALLOWED_WHEN_SIGNED_OUT.has(pathname)) {
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  return null;
}
