"use client";
import { applyActionCode } from "firebase/auth";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/client-provider";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

function VerifyEmailContent() {
  const { user, resendVerification, logout } = useAuth();
  // Only link-based verification logic. No manual code, no redundant state.
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
    if (!auth.currentUser) {
      if (mode === "verifyEmail" && oobCode) {
        localStorage.setItem("pendingEmailVerification", JSON.stringify({ oobCode, mode }));
      }
      router.replace('/login?redirect=/verify-email');
      return;
    }
    if (mode === "verifyEmail" && oobCode) {
      setVerifying(true);
      (async () => {
        try {
          await applyActionCode(auth, oobCode);
          await auth.currentUser?.reload();
          router.replace('/login?verified=1');
        } catch (e) {
          const errorMsg = (typeof e === 'object' && e && 'message' in e) ? (e as any).message : 'Could not verify email.';
          toast({ title: "Verification failed", description: errorMsg, variant: "destructive" });
          console.error('Verification failed:', e);
        } finally {
          setVerifying(false);
        }
      })();
      return;
    }
    const pending = localStorage.getItem("pendingEmailVerification");
    if (pending) {
      try {
        const { oobCode: storedCode, mode: storedMode } = JSON.parse(pending);
        if (storedMode === "verifyEmail" && storedCode) {
          setVerifying(true);
          (async () => {
            try {
              await applyActionCode(auth, storedCode);
              await auth.currentUser?.reload();
              router.replace('/login?verified=1');
            } catch (e) {
              const errorMsg = (typeof e === 'object' && e && 'message' in e) ? (e as any).message : 'Could not verify email.';
              toast({ title: "Verification failed", description: errorMsg, variant: "destructive" });
              console.error('Verification failed:', e);
            } finally {
              setVerifying(false);
              localStorage.removeItem("pendingEmailVerification");
            }
          })();
          return;
        }
      } catch {
        localStorage.removeItem("pendingEmailVerification");
      }
    }
    async function autoCheck() {
      await (auth.currentUser.reload?.() ?? Promise.resolve());
      try {
        await auth.currentUser.getIdToken(true);
      } catch {}
      const current = auth.currentUser;
      if (current?.emailVerified) {
        router.replace('/login?verified=1');
        router.refresh();
        setTimeout(() => {
          if (window.location.pathname === '/verify-email') {
            window.location.assign('/login?verified=1');
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
      const errorMsg = (typeof e === 'object' && e && 'message' in e) ? (e as any).message : 'Could not resend.';
      toast({ title: "Error", description: errorMsg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    // ...existing code...
    // No manual code logic; only link-based verification
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 p-4">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-15 bg-[url('/grid.svg')] [background-position:0_0.5px]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
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
        {/* Debug info removed as requested */}
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
