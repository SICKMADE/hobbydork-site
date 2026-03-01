"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebase/client";

export default function OnboardingSuccess() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [finalizing, setFinalizing] = useState(true);

  useEffect(() => {
    async function finalize() {
      if (!user || !functions) return;
      try {
        const finalizeSeller = httpsCallable(functions, "finalizeSeller");
        await finalizeSeller({});
        toast({ title: "Onboarding Complete!", description: "Your shop is now live." });
        router.replace("/dashboard");
      } catch (err) {
        toast({ variant: "destructive", title: "Onboarding failed" });
        setFinalizing(false);
      }
    }
    finalize();
  }, [user, functions, router, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      {finalizing ? (
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
          <h1 className="text-2xl font-black">Finalizing your onboarding...</h1>
          <p className="text-muted-foreground">Please wait while we set up your shop.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
          <h1 className="text-2xl font-black">Onboarding failed</h1>
          <p className="text-muted-foreground">Please try again or contact support.</p>
        </div>
      )}
    </div>
  );
}
