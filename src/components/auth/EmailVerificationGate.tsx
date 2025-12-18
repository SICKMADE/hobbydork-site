'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const ALLOWED_WHEN_UNVERIFIED = new Set<string>(['/login', '/verify-email']);

export default function EmailVerificationGate() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    // If the user is signed in but not verified, only allow login/verify-email.
    if (!user.emailVerified) {
      if (!ALLOWED_WHEN_UNVERIFIED.has(pathname)) {
        router.replace('/verify-email');
      }
    }
  }, [loading, user, pathname, router]);

  return null;
}
