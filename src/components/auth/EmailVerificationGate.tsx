'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const ALLOWED_WHEN_UNVERIFIED = new Set<string>(['/login', '/verify-email']);

  const { profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) return;

    // If the user is signed in but not verified, only allow login/verify-email.
    if (!profile.emailVerified) {
      if (!ALLOWED_WHEN_UNVERIFIED.has(pathname)) {
        router.replace('/verify-email');
      }
    }
  }, [loading, profile, pathname, router]);

  return null;
}
