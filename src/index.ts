import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "./firebaseAdmin";
import Stripe from "stripe";
export { getStripePayouts } from "./getStripePayouts";
export { stripeWebhook } from "./stripeWebhook";
import * as functions from "firebase-functions";

// Use environment variable for Stripe secret, fallback to functions.config for legacy support
const config = typeof functions.config === "object" ? functions.config as { stripe?: { secret?: string } } : {};
const stripeSecret = process.env.STRIPE_SECRET || (config.stripe && config.stripe.secret);

/* ================= HELPERS ================= */

function getStripeInstance() {
  if (!stripeSecret) {
    throw new HttpsError("internal", "Stripe secret not set in Firebase config");
  }
  return new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
}

function requireAuth(request: any) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Auth required");
  if (!request.auth || request.auth.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Email verification required");
  }
  return uid;
}

/**
 * Audit log helper for sensitive actions
 */
async function logAudit(action: string, context: Record<string, any>) {
  await db.collection("auditLogs").add({
    action,
    ...context,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Helper to send notification to user
 */
async function sendNotification(uid: string, type: string, title: string, body: string, relatedId?: string) {
  await db.collection("users").doc(uid).collection("notifications").add({
    type,
    title,
    body,
    relatedId,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/* ================= GET STRIPE ACCOUNT DETAILS ================= */

export const getStripeAccount = onCall(async (request) => {
  const stripe = getStripeInstance();
  const { accountId } = request.data || {};
  if (!accountId) {
    throw new HttpsError("invalid-argument", "Missing accountId");
  }
  try {
    const account = await stripe.accounts.retrieve(accountId);
    let dashboardUrl: string | undefined = undefined;
    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId);
      dashboardUrl = loginLink.url;
    } catch (err) {
      dashboardUrl = undefined;
    }
    return {
      email: account.email,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      dashboardUrl,
    };
  } catch (err: any) {
    throw new HttpsError("internal", err.message || "Failed to fetch Stripe account");
  }
});

/* ================= CREATE STRIPE CHECKOUT SESSION ================= */

export const createCheckoutSession = onCall(async (request) => {
  const stripe = getStripeInstance();
  const uid = requireAuth(request);
  const { orderId, listingTitle, amountCents, appBaseUrl } = request.data || {};
  if (!orderId || !listingTitle || !amountCents || !appBaseUrl) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data();
  const userAddress = userData?.shippingAddress || {};
  
  const shippingAddress = {
    name: userAddress.name || "",
    line1: userAddress.address1 || "",
    line2: userAddress.address2 || "",
    city: userAddress.city || "",
    state: userAddress.state || "",
    postalCode: userAddress.zip || "",
    country: userAddress.country || "",
  };

  if (shippingAddress.line1 && shippingAddress.city && shippingAddress.state && shippingAddress.postalCode) {
    await db.collection("orders").doc(orderId).set({ shippingAddress }, { merge: true });
  }

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
    metadata: {
      orderId,
      buyerUid: uid,
      shippingAddress: JSON.stringify(shippingAddress),
    },
  });
  return { url: session.url };
});

/* ================= SECURE ORDER STATUS UPDATE ================= */

export const updateOrderStatus = onCall(async (request) => {
  const uid = requireAuth(request);
  const { orderId, updates } = request.data || {};
  if (!orderId || !updates || typeof updates !== "object") {
    throw new HttpsError("invalid-argument", "Missing orderId or updates");
  }
  const allowedFields = ["status", "trackingNumber", "shippingLabelUrl", "estimatedDelivery", "feedback", "updatedAt"];
  const updateKeys = Object.keys(updates);
  if (!updateKeys.every((k) => allowedFields.includes(k))) {
    throw new HttpsError("permission-denied", "Attempt to update forbidden fields");
  }

  const orderRef = db.collection("orders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new HttpsError("not-found", "Order not found");
  
  const order = orderSnap.data();
  if (order?.buyerUid !== uid && order?.sellerUid !== uid) {
    throw new HttpsError("permission-denied", "Not authorized");
  }

  await orderRef.update(updates);
  await logAudit("order-status-update", { orderId, updatedBy: uid, updates });
  
  if (updates.status === "SHIPPED") {
    await sendNotification(order?.buyerUid, "ORDER", "Order shipped", `Your order #${orderId} has shipped.`, orderId);
  }
  
  return { ok: true };
});