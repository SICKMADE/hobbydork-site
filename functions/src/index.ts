import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

/* ================= CREATE STRIPE CHECKOUT SESSION ================= */

export const createCheckoutSession = onCall(
  {
    region: "us-central1",
    secrets: ["STRIPE_SECRET", "APP_BASE_URL"],
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
      throw new HttpsError("failed-precondition", "Email verification required");
    }

    const { orderId, listingTitle, amountCents, appBaseUrl } = request.data || {};
    if (!orderId || !listingTitle || !amountCents || !appBaseUrl) {
      throw new HttpsError("invalid-argument", "Missing required parameters");
    }

    // Optionally: validate order in Firestore here

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listingTitle,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appBaseUrl}/cart/success?orderId=${orderId}`,
      cancel_url: `${appBaseUrl}/cart/cancel?orderId=${orderId}`,
      metadata: {
        orderId,
        buyerUid: uid,
      },
    });

    return { url: session.url };
  }
);

/* ================= HELPERS ================= */



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
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
      throw new HttpsError("failed-precondition", "Email verification required");
    }
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
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
      throw new HttpsError("failed-precondition", "Email verification required");
    }

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

    // Generate storeId from displayName (slugify)
    const displayName = user.ownerDisplayName || user.displayName || "";
    const storeId = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Create store document
    const storeRef = db.collection("stores").doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) {
      await storeRef.set({
        id: storeId,
        ownerId: uid,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        avatar: user.photoURL || "/hobbydork-head.png",
        status: "ACTIVE",
      });
    }

    // Update user doc with storeId and seller flags
    await userRef.update({
      isSeller: true,
      sellerStatus: "APPROVED",
      stripeOnboarded: true,
      stripeTermsAgreed: true,
      storeId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Log new seller approval for admin monitoring
    await db.collection("sellerApprovals").add({
      uid,
      email: user.email,
      displayName,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeAccountId: user.stripeAccountId,
    });

    return { ok: true, storeId };
  }
);
