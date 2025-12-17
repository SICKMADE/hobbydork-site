import { NextResponse } from "next/server";
import Stripe from "stripe";
import admin, { db } from "@/firebase/server";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY not set, Stripe routes will return 503");
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }
    const { listingId, buyerUid } = await req.json();

    const listingSnap = await db.collection('listings').doc(listingId).get();
    if (!listingSnap.exists) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    const listing = listingSnap.data() as any;
    if (!listing) return NextResponse.json({ error: 'Listing data missing' }, { status: 500 });

    const sellerSnap = await db.collection('users').doc(listing.ownerUid).get();
    const seller = sellerSnap.data() as any;
    if (!seller || !seller.stripeAccountId) {
      return NextResponse.json({ error: 'Seller not configured for Stripe' }, { status: 400 });
    }

    // Platform fee (recommended 10% or whatever you choose)
    const platformFee = Math.round(listing.price * 0.10);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: listing.title },
            unit_amount: listing.price * 100,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee * 100,
        transfer_data: {
          destination: seller.stripeAccountId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/orders/cancelled`,
    });

    // create order record (server-side)
    await db.collection('orders').add({
      listingId,
      buyerUid,
      sellerUid: listing.ownerUid,
      amount: listing.price,
      platformFee,
      stripeSessionId: session.id,
      status: "PENDING",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('CHECKOUT ERROR', err);
    return NextResponse.json({ error: err?.message || 'Internal error', details: err?.stack || err }, { status: 500 });
  }
}
