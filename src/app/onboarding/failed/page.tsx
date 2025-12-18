"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function OnboardingFailedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Onboarding Failed</CardTitle>
            <CardDescription>We couldn't complete Stripe onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-6 space-y-4 text-center">
              <p>Please try connecting Stripe again. If the problem persists, contact support.</p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => router.push('/store/create')}>Back to Store Setup</Button>
                <Button variant="outline" onClick={() => router.push('/store/create')}>Retry</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
