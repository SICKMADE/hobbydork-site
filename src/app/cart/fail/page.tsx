"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function CartFailPage() {
  return (
    <AppLayout>
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] p-4 bg-grid"
      >
        <Card className="w-full max-w-xl md:max-w-2xl border-4 border-yellow-400 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <CardHeader className="flex flex-col items-center gap-2">
            <CardTitle className="text-2xl font-bold text-center text-red-600">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Your payment could not be processed. Please try again or contact support if the issue persists.</p>
          </CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center pb-6">
            <Link href="/cart">
              <Button
                variant="default"
                className="w-40 inline-flex items-center justify-center rounded-full bg-red-500 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
              >
                Try Again
              </Button>
            </Link>
            <Link href="/help">
              <Button
                variant="outline"
                className="w-40 inline-flex items-center justify-center rounded-full bg-zinc-800 text-white shadow-[0_6px_0_#7f1010] active:translate-y-1 active:shadow-[0_0px_0_#7f1010] transition-all text-lg font-bold border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1"
              >
                Get Help
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
