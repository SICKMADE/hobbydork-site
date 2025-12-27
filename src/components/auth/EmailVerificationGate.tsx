"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function EmailVerificationGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    router.replace("/login");
    return null;
  }

  if (!profile?.emailVerified) {
    router.replace("/login?verify=1");
    return null;
  }

  return <>{children}</>;
}
