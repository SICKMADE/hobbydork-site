"use client";

import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/firebase/client-provider";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function BecomeSellerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function apply() {
    if (!user) return;

    setLoading(true);

    // Mark user as seller applicant ONLY
    await updateDoc(doc(db, "users", user.uid), {
      sellerApplicationStatus: "PENDING",
      isSeller: false,
      appliedAt: serverTimestamp(),
    });

    toast({
      title: "Application Submitted",
      description:
        "Your application has been received. Stripe onboarding will be required once approved.",
    });

    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Become a Seller</h1>

      <p className="text-gray-500">
        Apply to become a seller on HobbyDork. Stripe onboarding will be required
        after approval.
      </p>

      <Button onClick={apply} disabled={loading}>
        {loading ? "Submitting…" : "Apply to Become a Seller"}
      </Button>
    </div>
  );
}
