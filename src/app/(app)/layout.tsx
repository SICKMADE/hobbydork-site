'use client';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser, useFirebase } from '@/firebase';

function VerifyEmailScreen() {
    const { logout } = useAuth();
    const { auth } = useFirebase();

    const handleResend = async () => {
        if (auth.currentUser) {
            await auth.currentUser.sendEmailVerification();
            alert('A new verification email has been sent.');
        }
    };

    const handleReload = async () => {
        if (auth.currentUser) {
            await auth.currentUser.reload();
            // The useAuth effect will handle the status update and redirect
            window.location.reload(); 
        }
    };

    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Please Verify Your Email</h1>
        <p className="max-w-md">A verification link has been sent to your email address. Please click the link to activate your account. If you don't see it, check your spam folder.</p>
        <div className="flex gap-4">
            <Button onClick={handleReload} variant="default">I've Verified My Email</Button>
            <Button onClick={handleResend} variant="outline">Resend Email</Button>
        </div>
        <Button onClick={() => logout()} variant="link" className="mt-8">
          Logout
        </Button>
      </div>
    );
}

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Wait until auth state is resolved.
    }

    if (!user) {
      router.replace('/'); // Not logged in, go to auth page.
      return;
    }

    // After loading, if profile is available, check other conditions
    if (profile) {
      // 1. Check for email verification
      if (!user.emailVerified) {
        // User's email is not verified, no need to check other things.
        // The VerifyEmailScreen will be shown by the main render logic.
        return;
      }
      
      // 2. Check for global agreements (only if email is verified)
      const needsGlobalOnboarding = !profile.oneAccountAcknowledged || !profile.goodsAndServicesAgreed;
      if (needsGlobalOnboarding && pathname !== '/onboarding') {
        router.replace('/onboarding');
        return;
      }
      
      // If user has completed agreements but lands on onboarding, send to dashboard.
      if (!needsGlobalOnboarding && pathname === '/onboarding') {
          router.replace('/');
          return;
      }
    }

  }, [user, profile, loading, pathname, router]);

  // While loading, show a full-screen loader.
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    // This case is handled by the useEffect, but as a fallback:
    return <div className="flex items-center justify-center h-screen">Redirecting to login...</div>;
  }
  
  // After loading, check conditions
  
  // 1. Email Verification Check
  if (!user.emailVerified) {
      return <VerifyEmailScreen />;
  }

  // 2. Global Onboarding Check
  if (profile) {
      const needsGlobalOnboarding = !profile.oneAccountAcknowledged || !profile.goodsAndServicesAgreed;
      if (needsGlobalOnboarding) {
        // If we are already on the onboarding page, let it render.
        if (pathname === '/onboarding') {
          return <>{children}</>;
        }
        // Otherwise, we are still waiting for the useEffect redirect.
        return <div className="flex items-center justify-center h-screen">Redirecting to onboarding...</div>;
      }
  }

  // 3. Suspended User Check
  if (profile?.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact support.</p>
         <Button onClick={() => {
             const authModule = require('firebase/auth');
             const { initializeFirebase } = require('@/firebase');
             const { auth } = initializeFirebase();
             authModule.signOut(auth).then(() => window.location.href = '/');
         }} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  // If we've passed all checks, render the main application content.
  if (user && profile) {
    return <>{children}</>;
  }

  // Fallback loading state for any other transitional conditions.
  return <div className="flex items-center justify-center h-screen">Loading application...</div>;
}