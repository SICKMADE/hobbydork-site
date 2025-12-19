"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/firebase/client-provider";

export default function VerifyEmailPage() {
  const { user, resendVerification } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

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

      // Refresh the *actual* Firebase Auth currentUser so emailVerified updates.
      // Verifying in another tab/device does not automatically refresh this session.
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
        // Fallback: if router navigation is blocked by an extension, still proceed.
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
            <Button onClick={handleResend} disabled={sending}>{sending ? 'Sending…' : 'Resend email'}</Button>
            <Button variant="outline" onClick={handleCheck} disabled={checking}>{checking ? 'Checking…' : "I've verified"}</Button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or try resending.
          </div>
        </div>
      </div>
    </div>
  );
}
