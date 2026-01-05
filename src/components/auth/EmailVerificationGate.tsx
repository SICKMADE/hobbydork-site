'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function EmailVerificationGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // ✅ allow verify page to render
    if (pathname === '/verify-email') return;

    // redirect unverified users everywhere else
    if (
      user &&
      (!user.emailVerified || (profile && !profile.emailVerified))
    ) {
      router.replace('/verify-email');
    }
  }, [user, profile, loading, pathname, router]);

  if (loading || (user && (!user.emailVerified || (profile && !profile.emailVerified)))) {
    // Show spinner while waiting for both verifications
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
        <span className="ml-4 text-muted-foreground text-lg">Checking email verification…</span>
      </div>
    );
  }

  // ✅ allow verify page to render
  if (pathname === '/verify-email') {
    return <>{children}</>;
  }

  return <>{children}</>;
}
