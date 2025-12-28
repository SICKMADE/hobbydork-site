'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function EmailVerificationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user && !user.emailVerified) {
      router.replace('/login?verify=1');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user && !user.emailVerified) return null;

  return <>{children}</>;
}
