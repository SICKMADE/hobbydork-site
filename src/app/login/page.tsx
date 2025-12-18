"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthComponent from "@/components/auth/AuthComponent";
import { useUser } from "@/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      if (user.emailVerified) {
        router.replace("/");
      } else {
        router.replace("/verify-email");
      }
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (user) return null;

  return <AuthComponent />;
}
