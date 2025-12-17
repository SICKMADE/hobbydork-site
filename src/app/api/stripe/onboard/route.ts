import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/firebase/server";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set, Stripe routes will return 503");
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const { uid, email } = await req.json();

  // Create or retrieve account
  const account = await stripe.accounts.create({
    type: "standard",
    email,
  });

  await db.collection('users').doc(uid).update({
    stripeAccountId: account.id,
  });

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/failed`,
    return_url: `${process.env.NEXT_PUBLIC_URL}/onboarding/success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: link.url });
}
