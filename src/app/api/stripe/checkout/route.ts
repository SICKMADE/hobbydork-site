
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' }) 
  : null;

/**
 * Stripe Checkout API Route.
 * Uses real Stripe if STRIPE_SECRET_KEY is present in .env, otherwise mocks.
 */
export async function POST(request: Request) {
  try {
    const { items, success_url, cancel_url, metadata } = await request.json();

    if (!stripe) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Stripe Key missing, using Mock Checkout');
      }
      const sessionId = `mock_session_${Math.random().toString(36).substring(7)}`;
      return NextResponse.json({ 
        sessionId,
        url: `${success_url}?session_id=${sessionId}&item_id=${metadata?.listingId || metadata?.productId}`
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
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}&item_id=${metadata?.listingId || metadata?.productId}`,
      cancel_url: cancel_url,
      metadata: metadata,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
