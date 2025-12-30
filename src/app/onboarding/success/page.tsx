"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

export default function StripeOnboardingSuccess() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const user = getAuth().currentUser;
      if (!user) {
        router.replace("/login");
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(
        "https://us-central1-studio-4668517724-751eb.cloudfunctions.net/checkStripeSellerStatus",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (json.isSeller) {
        router.replace("/become-seller/terms");
      } else {
        router.replace("/become-seller");
      }
    };

    run();
  }, [router]);

  return (
    <div className="p-10">
      <h1>Finalizing seller setup…</h1>
    </div>
  );
}
