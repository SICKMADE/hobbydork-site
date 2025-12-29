'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

import { usePathname } from 'next/navigation';

const ALLOWED_WHEN_UNVERIFIED = new Set<string>(['/login', '/verify-email']);

export default function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const { profile, loading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile || !user) return;
    // Always reload user to get latest emailVerified status
    user.reload?.().then(() => {
      if (!user.emailVerified) {
        if (!ALLOWED_WHEN_UNVERIFIED.has(pathname)) {
          router.replace('/verify-email');
        }
      }
    });
  }, [loading, profile, user, pathname, router]);

  if (loading) return null;
  if (user && !user.emailVerified) return null;

  return <>{children}</>;
}
