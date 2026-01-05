import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

/* ================= HELPERS ================= */

function requireVerified(request: any) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Auth required");
  }

  if (request.auth.token.email_verified !== true) {
    throw new HttpsError(
      "failed-precondition",
      "Email verification required"
    );
  }

  return request.auth.uid;
}

/* ================= STRIPE ================= */

const stripe = new Stripe(process.env.STRIPE_SECRET!, {
  apiVersion: "2023-10-16",
});

/* ================= CREATE STRIPE ONBOARDING ================= */

export const createStripeOnboarding = onCall(
  {
    region: "us-central1",
    secrets: ["STRIPE_SECRET", "APP_BASE_URL"],
  },
  async (request) => {
    const uid = requireVerified(request);

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();

    let accountId = user?.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await userRef.set(
        {
          stripeAccountId: accountId,
          sellerStatus: "PENDING",
          isSeller: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const baseUrl =
      process.env.APP_BASE_URL || "http://localhost:9002";

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/onboarding/terms`,
      return_url: `${baseUrl}/onboarding/success`,
      type: "account_onboarding",
    });

    return { url: link.url };
  }
);

/* ================= FINALIZE SELLER ================= */

export const finalizeSeller = onCall(
  {
    region: "us-central1",
    secrets: ["STRIPE_SECRET"],
  },
  async (request) => {
    const uid = requireVerified(request);

    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();

    if (!user?.stripeAccountId) {
      throw new HttpsError(
        "failed-precondition",
        "Stripe not connected"
      );
    }

    const account = await stripe.accounts.retrieve(
      user.stripeAccountId
    );

    if (!account.details_submitted || !account.charges_enabled) {
      throw new HttpsError(
        "failed-precondition",
        "Stripe onboarding incomplete"
      );
    }

    await userRef.update({
      isSeller: true,
      sellerStatus: "APPROVED",
      stripeOnboarded: true, // Set true when Stripe onboarding is complete
      stripeTermsAgreed: true, // Set true when Stripe onboarding is complete
      // storeId: "your-store-id", // <-- Set this if you have it at this point
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log new seller approval for admin monitoring
    await db.collection("sellerApprovals").add({
      uid,
      email: user.email,
      displayName: user.ownerDisplayName || user.displayName || "",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeAccountId: user.stripeAccountId,
    });

    return { ok: true };
  }
);
