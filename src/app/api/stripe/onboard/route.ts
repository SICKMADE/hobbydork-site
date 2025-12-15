import { NextResponse } from "next/server";
import Stripe from "stripe";
import admin, { db } from "@/firebase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY! as string);

export async function POST(req: Request) {
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
