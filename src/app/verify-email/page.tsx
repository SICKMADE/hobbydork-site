"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

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
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in first.", variant: 'destructive' });
        return;
      }
      await (user.reload?.() ?? Promise.resolve());
      const current = (await import('firebase/auth')).getAuth().currentUser;
      if (current?.emailVerified) {
        toast({ title: "Verified", description: "Thanks — continuing setup." });
        // Hard navigation ensures the app reloads auth state as verified.
        window.location.href = '/';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
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
            <Button variant="secondary" onClick={handleCheck} disabled={checking}>{checking ? 'Checking…' : "I've verified"}</Button>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or try resending.
          </div>
        </div>
      </div>
    </div>
  );
}
