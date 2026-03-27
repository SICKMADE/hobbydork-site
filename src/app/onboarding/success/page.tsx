"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc } from "@/firebase";

import { httpsCallable, getFunctions } from "firebase/functions";
import { doc, getDoc } from "firebase/firestore";
import { reload } from "firebase/auth";


export default function OnboardingSuccess() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const functions = getFunctions();
  const [finalizing, setFinalizing] = useState(true);

  useEffect(() => {
    async function finalize() {
      if (!user || !functions || !db) return;
      setFinalizing(true);
      try {
        // 1. Force reload of Firebase Auth user
        await reload(user).catch(() => {});

        // 2. Force re-fetch of user profile from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) throw new Error('User profile missing after Stripe onboarding.');

        // 3. Optionally, force re-fetch of storefront (if needed)
        if (userSnap.data()?.storeId) {
          const storeRef = doc(db, 'storefronts', userSnap.data().storeId);
          await getDoc(storeRef);
        }

        // 4. Invalidate any local cache (if using SWR/React Query, trigger revalidation here)
        // (Add cache invalidation logic here if needed)

        // 5. Call backend to finalize seller onboarding
        const finalizeSeller = httpsCallable(functions, "finalizeSeller");
        await finalizeSeller({});
        toast({ title: "Onboarding Complete!", description: "Your storefront is now live." });
        router.replace("/dashboard");
      } catch (err) {
        toast({ variant: "destructive", title: "Onboarding failed" });
        setFinalizing(false);
      }
    }
    finalize();
  }, [user, functions, db, router, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      {finalizing ? (
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
          <h1 className="text-2xl font-black">Finalizing your onboarding...</h1>
          <p className="text-muted-foreground">Please wait while we set up your storefront.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
          <h1 className="text-2xl font-black">Onboarding failed</h1>
          <p className="text-muted-foreground">Please try again or contact support.</p>
          <Button onClick={() => window.location.reload()} className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">Retry</Button>
        </div>
      )}
    </div>
  );
}
