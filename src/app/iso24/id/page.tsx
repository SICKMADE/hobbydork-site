"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ISOIdIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/iso24");
  }, [router]);

  return <div className="p-6">Redirecting…</div>;
}
