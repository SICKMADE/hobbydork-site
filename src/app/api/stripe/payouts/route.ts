import { NextResponse } from "next/server";

// Deprecated: Use Firebase Cloud Function 'getStripePayouts' to retrieve payouts and balance.
export async function POST() {
  return NextResponse.json(
    {
      error: "Deprecated",
      message:
        "This endpoint is deprecated. Use the Firebase Cloud Function 'getStripePayouts' instead.",
    },
    { status: 410 }
  );
}
