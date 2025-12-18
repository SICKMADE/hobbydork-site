import { NextResponse } from "next/server";

// Deprecated: Stripe server logic now lives in Firebase Cloud Functions.
// Leave a helpful response so accidental calls fail loudly and point to functions.
export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated",
      message:
        "This endpoint is deprecated. Use the Firebase Cloud Function 'onboardStripe' instead.",
    },
    { status: 410 }
  );
}
