'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function EmailVerificationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ✅ allow verify page to render
    if (pathname === '/verify-email') return;

    // redirect unverified users everywhere else
    if (user && !user.emailVerified) {
      router.replace('/verify-email');
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;

  // ✅ allow verify page to render
  if (pathname === '/verify-email') {
    return <>{children}</>;
  }

  // block rest of app if unverified
  if (user && !user.emailVerified) return null;

  return <>{children}</>;
}
