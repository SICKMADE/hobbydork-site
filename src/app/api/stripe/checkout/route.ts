
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeApiKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;
const stripe = stripeApiKey
  ? new Stripe(stripeApiKey, { apiVersion: '2023-10-16' }) 
  : null;

/**
 * Stripe Checkout API Route.
 * Uses real Stripe if STRIPE_SECRET_KEY is present, otherwise mock.
 */
export async function POST(request: Request) {
  try {
    const { items, success_url, cancel_url, metadata } = await request.json();
    const origin = request.headers.get('origin') || 'https://hobbydork.com';

    // Helper to ensure URLs are absolute
    const ensureAbsolute = (url: string) => {
      try {
        return new URL(url).toString();
      } catch {
        return new URL(url, origin).toString();
      }
    };

    const absoluteSuccessUrl = ensureAbsolute(success_url);
    const absoluteCancelUrl = ensureAbsolute(cancel_url);

    if (!stripe) {
      const sessionId = `mock_session_${Math.random().toString(36).substring(7)}`;
      const finalUrl = new URL(absoluteSuccessUrl);
      
      finalUrl.searchParams.set('session_id', sessionId);
      const idToPass = metadata?.listingId || metadata?.productId;
      if (idToPass) {
        finalUrl.searchParams.set('item_id', idToPass);
      }
      
      return NextResponse.json({ 
        sessionId,
        url: finalUrl.toString()
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${absoluteSuccessUrl}?session_id={CHECKOUT_SESSION_ID}&item_id=${metadata?.listingId || metadata?.productId}`,
      cancel_url: absoluteCancelUrl,
      metadata: metadata,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
