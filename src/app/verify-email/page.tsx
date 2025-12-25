
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase/client-provider";

function VerifyEmailContent() {
  const { user, resendVerification, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const searchParams = useSearchParams();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch (e) {
      toast({ title: 'Error', description: 'Could not sign out. Please refresh and try again.', variant: 'destructive' });
    } finally {
      setSigningOut(false);
    }
  };

  // Handle email verification via oobCode in URL and session state
  useEffect(() => {
    const oobCode = searchParams?.get("oobCode");
    const mode = searchParams?.get("mode");
    // If not signed in, store code and redirect to login
    if (!auth.currentUser) {
      if (mode === "verifyEmail" && oobCode) {
        // Store code in localStorage for after login
        localStorage.setItem("pendingEmailVerification", JSON.stringify({ oobCode, mode }));
      }
      router.replace('/login?redirect=/verify-email');
      return;
    }
    // If code is present in URL, apply it
    if (mode === "verifyEmail" && oobCode) {
      setVerifying(true);
      applyActionCode(auth, oobCode)
        .then(async () => {
          await (auth.currentUser?.reload?.() ?? Promise.resolve());
          toast({ title: "Email verified!", description: "Your email has been verified. You can now use your account." });
          router.replace("/");
          router.refresh();
        })
        .catch((e) => {
          toast({ title: "Verification failed", description: e?.message ?? "Could not verify email.", variant: "destructive" });
        })
        .finally(() => setVerifying(false));
      return;
    }
    // If code is stored in localStorage, apply it after login
    const pending = localStorage.getItem("pendingEmailVerification");
    if (pending) {
      try {
        const { oobCode: storedCode, mode: storedMode } = JSON.parse(pending);
        if (storedMode === "verifyEmail" && storedCode) {
          setVerifying(true);
          applyActionCode(auth, storedCode)
            .then(async () => {
              await (auth.currentUser?.reload?.() ?? Promise.resolve());
              toast({ title: "Email verified!", description: "Your email has been verified. You can now use your account." });
              router.replace("/");
              router.refresh();
              localStorage.removeItem("pendingEmailVerification");
            })
            .catch((e) => {
              toast({ title: "Verification failed", description: e?.message ?? "Could not verify email.", variant: "destructive" });
              localStorage.removeItem("pendingEmailVerification");
            })
            .finally(() => setVerifying(false));
          return;
        }
      } catch {
        localStorage.removeItem("pendingEmailVerification");
      }
    }
    // Auto-check verification status on page load
    async function autoCheck() {
      await (auth.currentUser.reload?.() ?? Promise.resolve());
      try {
        await auth.currentUser.getIdToken(true);
      } catch {}
      const current = auth.currentUser;
      if (current?.emailVerified) {
        toast({ title: "Verified", description: "Thanks — continuing setup." });
        router.replace('/');
        router.refresh();
        setTimeout(() => {
          if (window.location.pathname === '/verify-email') {
            window.location.assign('/');
          }
        }, 400);
      }
    }
    autoCheck();
  }, [router, toast, searchParams]);

  const handleResend = async () => {
    try {
      setSending(true);
      await resendVerification();
      toast({ title: "Verification sent", description: "Check your inbox." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not resend.", variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    try {
      setChecking(true);
      if (!auth.currentUser) {
        toast({ title: "Not signed in", description: "Please sign in first.", variant: 'destructive' });
        return;
      }

      // Force reload to get latest emailVerified status
      await (auth.currentUser.reload?.() ?? Promise.resolve());
      // Force-refresh token so any server-side checks also see new state.
      try {
        await auth.currentUser.getIdToken(true);
      } catch {
        // ignore token refresh errors; reload above is the main signal
      }

      const current = auth.currentUser;

      if (current?.emailVerified) {
        toast({ title: "Verified", description: "Thanks — continuing setup." });
        router.replace('/');
        router.refresh();
        setTimeout(() => {
          if (window.location.pathname === '/verify-email') {
            window.location.assign('/');
          }
        }, 400);
      } else {
        toast({ title: "Not verified yet", description: "Please click the link in your email and then try again." });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message ?? "Could not check verification.", variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 p-4">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-15 bg-[url('/grid.svg')] [background-position:0_0.5px]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 relative">
            <Image src="/hobbydork-head.png" alt="HobbyDork" fill className="object-contain" />
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm p-6 text-center">
          <h2 className="text-2xl font-semibold">Verify your email</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            We sent a verification link to <strong>{user?.email}</strong>. Click the link in your email to verify your account.
          </p>

          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={handleResend} disabled={sending || verifying}>{sending ? 'Sending…' : 'Resend email'}</Button>
            <Button variant="outline" onClick={handleCheck} disabled={checking || verifying}>{checking ? 'Checking…' : "I've verified"}</Button>
            <Button variant="ghost" onClick={handleSignOut} disabled={signingOut || verifying}>
              {signingOut ? 'Signing out…' : 'Sign out and try again'}
            </Button>
          </div>
          {verifying && (
            <div className="mt-4 text-sm text-blue-600">Verifying your email…</div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or try resending.
          </div>

          {/* DEBUG INFO */}
          <div className="mt-6 p-3 rounded bg-neutral-900 text-left text-xs text-yellow-300">
            <div><strong>Debug Info:</strong></div>
            <div>User: {user ? JSON.stringify({ email: user.email, emailVerified: user.emailVerified, uid: user.uid }, null, 2) : 'No user'}</div>
            <div>auth.currentUser: {auth.currentUser ? JSON.stringify({ email: auth.currentUser.email, emailVerified: auth.currentUser.emailVerified, uid: auth.currentUser.uid }, null, 2) : 'No currentUser'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
