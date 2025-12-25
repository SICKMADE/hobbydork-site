"use client";


import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthComponent from "@/components/auth/AuthComponent";
import { useUser } from "@/firebase";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();
  const [initialTab, setInitialTab] = useState<"login" | "signup">("login");
  const [showVerifiedMsg, setShowVerifiedMsg] = useState(false);

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
    // Show verified message if redirected from email verification
    if (searchParams?.get("verified") === "1") {
      setShowVerifiedMsg(true);
    }
  }, [searchParams]);

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

  return (
    <>
      {showVerifiedMsg && (
        <div className="mb-4 max-w-md mx-auto bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded text-center">
          Your email has been verified. Please log in to continue.
        </div>
      )}
      <AuthComponent initialTab={initialTab} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}
