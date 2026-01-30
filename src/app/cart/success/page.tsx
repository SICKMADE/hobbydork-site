"use client";


import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CartSuccessPage() {
  const { refreshProfile } = useAuth();
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);
  return (
    <AppLayout>
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-grid"
      >
        <Card className="w-full max-w-xl md:max-w-2xl border-4 border-yellow-400 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <CardHeader className="flex flex-col items-center gap-2">
            <Image
              src="/success.png"
              alt="Success"
              width={200}
              height={200}
              className="mb-2 rounded-full border-2 border-red-500"
              priority
            />
            <CardTitle className="text-2xl font-bold text-center">Thank you for your purchase!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Thanks for shopping with HobbyDork! Your order is confirmed and we appreciate your support.</p>
          </CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center pb-6">
            <Link href="/orders">
              <Button
                variant="default"
                className="w-40 inline-flex items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
              >
                View My Orders
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="w-40 inline-flex items-center justify-center rounded-full bg-zinc-800 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
