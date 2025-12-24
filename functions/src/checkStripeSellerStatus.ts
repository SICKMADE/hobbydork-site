import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;
  const secret = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Missing Stripe secret");
  stripeInstance = new Stripe(secret, { apiVersion: "2023-10-16" });
  return stripeInstance;
}

/**
 * Callable function to check Stripe account status and update isSeller.
 * Only sets isSeller: true if charges_enabled === true.
 */
export const checkStripeSellerStatus = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();
    const accountId = userData?.stripeAccountId;
    if (!accountId) {
      return { isSeller: false, reason: "No Stripe account ID" };
    }
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(accountId);
    if (account.charges_enabled) {
      await userRef.update({ isSeller: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { isSeller: true };
    } else {
      await userRef.update({ isSeller: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      return { isSeller: false, reason: "Stripe account not enabled for charges" };
    }
  });