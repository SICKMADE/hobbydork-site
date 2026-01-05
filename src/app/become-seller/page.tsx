"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BecomeSellerRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/become-seller/welcome");
  }, [router]);

  return null;
}
