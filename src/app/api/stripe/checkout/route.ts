import { NextResponse } from "next/server";

// Deprecated: Checkout server logic moved to Firebase Cloud Functions.
export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated",
      message:
        "This endpoint is deprecated. Use the Firebase Cloud Function 'createCheckoutSession' instead.",
    },
    { status: 410 }
  );
}
