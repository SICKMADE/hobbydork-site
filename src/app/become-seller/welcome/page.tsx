"use client";

import React from "react";
import SellerOnboardingStepper from "@/components/onboarding/SellerOnboardingStepper";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BecomeSellerWelcome() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-grid-pattern">
      <SellerOnboardingStepper step={1} />
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-10 rounded-2xl shadow-2xl border border-white bg-background/90 backdrop-blur-md p-8 md:p-12">
        <div className="flex-shrink-0 flex justify-center w-full md:w-auto mb-8 md:mb-0">
          <img
            src="/apply.png"
            alt="Apply to Sell"
            className="object-contain w-[180px] h-[180px] md:w-[280px] md:h-[280px] rounded-xl shadow-lg border-4 border-white focus:outline-none focus:ring-2 focus:ring-primary"
            tabIndex={0}
          />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-extrabold text-primary mb-6 text-center md:text-left drop-shadow-sm">
            Welcome, Future HobbyDork Seller!
          </h1>
          <p className="mb-3 text-lg text-foreground text-center md:text-left">
            At HobbyDork, we’re building more than just a marketplace—we’re creating a trusted community where honest sellers and buyers connect, share their passions, and enjoy great deals without worry.
          </p>
          <p className="mb-3 text-foreground text-center md:text-left">
            We’re looking for sellers who care about integrity, clear communication, and making every transaction a positive experience. Your commitment to honesty and respect helps ensure that everyone on HobbyDork can buy and sell with confidence.
          </p>
          <ul className="mb-3 pl-5 list-disc text-foreground text-left">
            <li>Safe, friendly, and fair for everyone</li>
            <li>Filled with genuine hobbyists and collectors</li>
            <li>Focused on great deals and great experiences</li>
          </ul>
          <p className="mb-3 text-foreground text-center md:text-left">
            <strong>What makes HobbyDork different?</strong> We offer sellers a unique approach: whether you want to post an ISO (In Search Of), make a regular marketplace sale, or—coming soon—try a brand new selling method that will be a first in the industry and benefit every seller, you’ll find your place here.
          </p>
          <p className="mb-3 text-foreground text-center md:text-left">
            <strong>Important:</strong> To protect our community, HobbyDork reserves the right to suspend or remove any seller account at our sole discretion if we believe it is necessary to maintain a safe, trustworthy, and positive environment for all users.
          </p>
          <p className="text-foreground text-center md:text-left mb-8">
            If you share these values and are ready to contribute to our community, we’re excited to have you onboard!
          </p>
          <div className="flex justify-center md:justify-end">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-lg px-10 py-4 font-extrabold rounded-full shadow-lg border-4 border-b-8 border-r-8 border-gray-700 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all duration-100 select-none focus:outline-none focus:ring-2 focus:ring-red-400 custom-btn-shadow custom-letter custom-textshadow"
              onClick={() => router.push("/onboarding/terms")}
              aria-label="Next"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
