import { onCall, HttpsError } from "firebase-functions/v2/https";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";
import * as functions from "firebase-functions";

/**
 * Callable function to get Stripe payouts and balance for a connected account.
 * Expects: { accountId: string }
 * Returns: { balance, payouts }
 */
const stripeSecret = defineSecret("STRIPE_SECRET");
export const getStripePayouts = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!stripeSecret.value()) {
    throw new HttpsError("internal", "Stripe secret not set in environment");
  }
  const stripe = new Stripe(stripeSecret.value(), { apiVersion: "2023-10-16" });
  const { accountId } = request.data || {};
  if (!accountId) {
    throw new HttpsError("invalid-argument", "Missing accountId");
  }
  try {
    // Get balance
    const balance = await stripe.balance.retrieve({ stripeAccount: accountId });
    // Get recent payouts (limit 10)
    const payouts = await stripe.payouts.list({ limit: 10 }, { stripeAccount: accountId });
    return {
      balance,
      payouts: payouts.data,
    };
  } catch (err: any) {
    throw new HttpsError("internal", err.message || "Failed to fetch Stripe payouts");
  }
});
