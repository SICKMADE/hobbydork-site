import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, auth } from "@/firebase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY! as string);

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const user = userSnap.data();
    if (!user || !user.stripeAccountId) {
      return NextResponse.json({ error: "Stripe not connected" }, { status: 400 });
    }

    const accountId = user.stripeAccountId;

    // Stripe balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    // Recent payouts
    const payouts = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: accountId }
    );

    return NextResponse.json({
      balance,
      payouts: payouts.data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
