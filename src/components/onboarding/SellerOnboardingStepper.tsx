import React from "react";

interface SellerOnboardingStepperProps {
  step: number; // 1-based
  steps?: string[];
}

export default function SellerOnboardingStepper({ step, steps = ["Welcome", "Terms & Agreement"] }: SellerOnboardingStepperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex items-center justify-center gap-4 py-4">
      {steps.map((label, i) => {
        const isActive = step === i + 1;
        const isCompleted = step > i + 1;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className={
                  `rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ` +
                  (isActive
                    ? "bg-red-600 text-white border-red-600 shadow-lg"
                    : isCompleted
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-gray-200 text-gray-500 border-gray-300")
                }
              >
                {i + 1}
              </div>
              <span className="text-xs mt-1 font-medium text-center whitespace-nowrap min-w-[60px]">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded ${step > i + 1 ? "bg-green-500" : "bg-gray-300"}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
