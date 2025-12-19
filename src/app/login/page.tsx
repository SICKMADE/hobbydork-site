"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthComponent from "@/components/auth/AuthComponent";
import { useUser } from "@/firebase";

export default function LoginPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const [initialTab, setInitialTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromHash = () => {
      setInitialTab(window.location.hash === "#signup" ? "signup" : "login");
    };

    // Set initial state and keep it in sync if the hash changes
    // (Next.js may not remount the page when only the hash changes).
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

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

  return <AuthComponent initialTab={initialTab} />;
}
