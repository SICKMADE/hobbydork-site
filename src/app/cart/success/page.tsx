"use client";

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Link from "next/link";
import Image from "next/image";

export default function CartSuccessPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md shadow-lg border-green-500">
          <CardHeader className="flex flex-col items-center gap-2">
            <Image
              src="/success.png"
              alt="Success"
              width={80}
              height={80}
              className="mb-2 rounded-full border-2 border-green-500 bg-white"
              priority
            />
            <CardTitle className="text-2xl font-bold text-center">Thank you for your purchase!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Your payment was successful and your order has been placed.</p>
            <p className="mt-2">You will receive an email confirmation shortly.</p>
          </CardContent>
          <div className="flex flex-col gap-2 items-center pb-6">
            <Link href="/orders">
              <Button variant="default" className="w-40">View My Orders</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-40">Back to Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
