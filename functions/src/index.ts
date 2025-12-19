import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

/**
 * APP_BASE_URL should be provided via environment in production.
 * Fallback order:
 *  - process.env.APP_BASE_URL
 *  - process.env.NEXT_PUBLIC_URL
 *  - localhost (development)
 */
const APP_BASE_URL =
  process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:9002";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

function tryNormalizeOrigin(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Support accidental values like "localhost:9002" (no protocol)
  const candidate =
    /^localhost(?::\d+)?(\/|$)/i.test(trimmed) || /^[\w.-]+:\d+(\/|$)/.test(trimmed)
      ? `http://${trimmed}`
      : trimmed;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

function resolveAppBaseUrl(
  maybeBaseUrl: unknown,
  requestOriginHeader?: unknown,
  requestRefererHeader?: unknown
): string {
  // If client explicitly sent appBaseUrl, validate it strictly.
  if (typeof maybeBaseUrl === "string" && maybeBaseUrl.trim().length > 0) {
    const normalized = tryNormalizeOrigin(maybeBaseUrl);
    if (!normalized) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid appBaseUrl. Expected an absolute URL like https://example.com or http://localhost:9002"
      );
    }
    return normalized;
  }

  // Fallback to callable request headers (usually correct for local dev ports).
  const fromOrigin = tryNormalizeOrigin(requestOriginHeader);
  if (fromOrigin) return fromOrigin;

  const fromReferer = tryNormalizeOrigin(requestRefererHeader);
  if (fromReferer) return fromReferer;

  // Env fallback (production should set APP_BASE_URL).
  return APP_BASE_URL;
}

function requireVerified(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required"
    );
  }

  // Server-side enforcement. Client redirects can be bypassed.
  if (context.auth.token.email_verified !== true) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Email verification required"
    );
  }
}

/**
 * Stripe lazy init (Firebase Secrets)
 */
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  // Prefer STRIPE_SECRET (set via Functions Secret Manager). Allow fallback to STRIPE_SECRET_KEY.
  const secret = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing Stripe secret (STRIPE_SECRET or STRIPE_SECRET_KEY)");
  }

  stripeInstance = new Stripe(secret, {
    apiVersion: "2023-10-16",
  });

  return stripeInstance;
}

/**
 * ===============================
 * CREATE STRIPE CHECKOUT SESSION
 * ===============================
 */
export const createCheckoutSession = functions
  .runWith({ secrets: ["STRIPE_SECRET", "APP_BASE_URL"] })
  .https.onCall(async (data, context) => {
    try {
      requireVerified(context);

      const { orderId, listingTitle, amountCents, appBaseUrl } = data;

      if (!orderId || !listingTitle || !amountCents) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required fields"
        );
      }

      const stripe = getStripe();

      const baseUrl = resolveAppBaseUrl(
        appBaseUrl,
        context.rawRequest?.headers?.origin,
        context.rawRequest?.headers?.referer
      );

      console.info("createCheckoutSession baseUrl", {
        baseUrl,
        appBaseUrl,
        origin: context.rawRequest?.headers?.origin,
        referer: context.rawRequest?.headers?.referer,
      });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amountCents,
              product_data: { name: listingTitle },
            },
            quantity: 1,
          },
        ],
        metadata: { orderId },
        success_url: `${baseUrl}/orders/success?orderId=${orderId}`,
        cancel_url: `${baseUrl}/orders/cancelled?orderId=${orderId}`,
      });

      await db.collection("orders").doc(orderId).update({
        stripeSessionId: session.id,
        state: "PENDING_PAYMENT",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { url: session.url };
    } catch (err: unknown) {
      console.error("createCheckoutSession failed:", err);
      throw new functions.https.HttpsError(
        "internal",
        errorMessage(err) || "Stripe checkout failed"
      );
    }
  });

/**
 * ===============================
 * STRIPE WEBHOOK
 * ===============================
 */
export const stripeWebhook = functions
  .runWith({
    secrets: ["STRIPE_SECRET", "STRIPE_WEBHOOK_SECRET"],
  })
  .https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    try {
      const stripe = getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      const event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        webhookSecret
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await db.collection("orders").doc(orderId).update({
            state: "PAID",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            stripePaymentIntentId: session.payment_intent,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.json({ received: true });
    } catch (err: unknown) {
      console.error("Webhook error:", err);
      res.status(400).send("Webhook failed");
    }
  });

/**
 * ===============================
 * STRIPE CONNECT ONBOARDING
 * ===============================
 */
export const onboardStripe = functions
  .runWith({ secrets: ["STRIPE_SECRET", "APP_BASE_URL"] })
  .https.onCall(async (data, context) => {
    try {
      requireVerified(context);

      const baseUrl = resolveAppBaseUrl(
        data?.appBaseUrl,
        context.rawRequest?.headers?.origin,
        context.rawRequest?.headers?.referer
      );

      const uid = context.auth.uid;
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      const userData = userSnap.data();

      const stripe = getStripe();
      let accountId = userData?.stripeAccountId;

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

        await userRef.update({
          stripeAccountId: accountId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/onboarding/failed`,
        return_url: `${baseUrl}/onboarding/success`,
        type: "account_onboarding",
      });

      return { url: accountLink.url };
    } catch (err: unknown) {
      console.error("onboardStripe failed:", err);
      throw new functions.https.HttpsError(
        "internal",
        errorMessage(err) || "Stripe onboarding failed"
      );
    }
  });

/**
 * ===============================
 * SELLER PAYOUTS
 * ===============================
 */
export const getStripePayouts = functions
  .runWith({ secrets: ["STRIPE_SECRET"] })
  .https.onCall(async (_data, context) => {
    try {
      requireVerified(context);

      const uid = context.auth.uid;
      const userSnap = await db.collection("users").doc(uid).get();
      const userData = userSnap.data();
      const accountId = userData?.stripeAccountId;

      if (!accountId) {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "No Stripe account connected"
        );
      }

      const stripe = getStripe();

      const payouts = await stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: accountId }
      );

      const balance = await stripe.balance.retrieve(
        {},
        { stripeAccount: accountId }
      );

      return { payouts: payouts.data, balance };
    } catch (err: unknown) {
      console.error("getStripePayouts failed:", err);
      throw new functions.https.HttpsError(
        "internal",
        errorMessage(err) || "Failed to fetch payouts"
      );
    }
  });

/**
 * ===============================
 * ISO24 TROPHIES
 * ===============================
 * Seller submits a fulfillment link under:
 *   /iso24Posts/{isoId}/comments/{commentId}
 * ISO owner approves a fulfillment, and we:
 *  - close the ISO
 *  - record fulfillment metadata
 *  - increment seller's trophies
 */
export const awardIsoTrophy = functions.https.onCall(
  async (data, context) => {
    requireVerified(context);

    const isoId = typeof data?.isoId === "string" ? data.isoId.trim() : "";
    const commentId = typeof data?.commentId === "string" ? data.commentId.trim() : "";

    if (!isoId || !commentId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing isoId or commentId"
      );
    }

    const callerUid = context.auth.uid;
    const isoRef = db.collection("iso24Posts").doc(isoId);
    const commentRef = isoRef.collection("comments").doc(commentId);

    await db.runTransaction(async (tx) => {
      const isoSnap = await tx.get(isoRef);
      if (!isoSnap.exists) {
        throw new functions.https.HttpsError("not-found", "ISO not found");
      }

      const iso = isoSnap.data() || {};
      const ownerUid = iso.ownerUid;

      if (ownerUid !== callerUid) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only the ISO owner can award a trophy"
        );
      }

      if (iso.status !== "OPEN") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "ISO is not open"
        );
      }

      if (iso.trophyAwardedAt) {
        throw new functions.https.HttpsError(
          "already-exists",
          "Trophy already awarded for this ISO"
        );
      }

      const commentSnap = await tx.get(commentRef);
      if (!commentSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Fulfillment link not found"
        );
      }

      const comment = commentSnap.data() || {};
      if (comment.type !== "FULFILLMENT") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Selected comment is not a fulfillment"
        );
      }

      const sellerUid = comment.authorUid;
      const listingUrl = comment.listingUrl;

      if (typeof sellerUid !== "string" || sellerUid.trim() === "") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Fulfillment is missing sellerUid"
        );
      }

      const sellerRef = db.collection("users").doc(sellerUid);

      tx.update(isoRef, {
        status: "CLOSED",
        fulfilledByUid: sellerUid,
        fulfilledCommentId: commentId,
        fulfilledListingUrl: typeof listingUrl === "string" ? listingUrl : null,
        trophyAwardedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.update(sellerRef, {
        trophies: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { ok: true };
  }
);
