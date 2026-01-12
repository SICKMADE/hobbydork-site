"use client";

import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import SellerSidebar from "@/components/dashboard/SellerSidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { getFirebase } from "@/firebase/client-init";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

export default function SellerDashboard() {
  const { user, userData } = useAuth();
  const { firestore: db } = getFirebase();

  if (!user || !userData || !userData.email) {
    return (
      <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center">
        <div className="max-w-lg w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-8 md:p-12">
          <h1 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h1>
          <Link href="/login" className="comic-button px-6 py-2 rounded text-white bg-primary hover:bg-primary/90 transition">Sign In</Link>
        </div>
      </div>
    );
  }
  if (!userData?.isSeller || userData?.status !== "ACTIVE") {
    return (
      <div className="min-h-screen h-screen flex flex-col items-center justify-center p-4 bg-[url('/grid.avg')] bg-cover bg-center">
        <div className="max-w-lg w-full flex flex-col items-center gap-8 rounded-2xl shadow-2xl border border-red-500 bg-background/90 backdrop-blur-md p-8 md:p-12">
          <img src="/apply.png" alt="Become a Seller" className="w-28 h-28 object-contain mb-2 drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold text-red-400 text-center mb-2">Become a Seller</h1>
          <p className="text-lg text-gray-100 text-center mb-4">
            HobbyDork is a safe community marketplace.<br />
            All sellers must follow strict safety rules and use secure Stripe payments.
          </p>
          <Link href="/become-seller" className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-8 py-3 font-bold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 w-full sm:w-auto text-center">
            Start Seller Onboarding
          </Link>
        </div>
      </div>
    );
  }
  }
