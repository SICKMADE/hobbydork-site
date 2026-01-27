import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "./firebaseAdmin";
import Stripe from "stripe";
export { getStripePayouts } from "./getStripePayouts";
export { createBlindBidAuction, submitBlindBid } from "./blindBidder";
export { setBlindBidAuctionImage } from "./blindBidder";
export { stripeWebhook } from "./stripeWebhook";
import * as functions from "firebase-functions";

// Use environment variable for Stripe secret, fallback to functions.config for legacy support
const config = typeof functions.config === "object" ? functions.config as { stripe?: { secret?: string } } : {};
const stripeSecret = process.env.STRIPE_SECRET || (config.stripe && config.stripe.secret);/* ================= HELPERS ================= */

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

/**
 * Error monitoring: log backend errors to Firestore for alerting
 */
async function logError(error: Error | string, context: Record<string, any> = {}) {
  await db.collection("errorLogs").add({
    error: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? undefined : error.stack,
    ...context,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
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

/* ========== CREATE AUCTION FEE CHECKOUT SESSION ========== */
export const createAuctionFeeCheckoutSession = onCall(async (request) => {
  const stripe = getStripeInstance();
  const uid = requireAuth(request);
  const { auctionId, auctionTitle, amountCents, appBaseUrl } = request.data || {};
  if (!auctionId || !auctionTitle || !amountCents || !appBaseUrl) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Auction Fee: ${auctionTitle}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appBaseUrl}/seller/auctions/success?auctionId=${auctionId}`,
    metadata: {
      auctionId,
      sellerUid: uid,
    },
  });
  return { sessionId: session.id, url: session.url };
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
  const shippingAddress = userData?.shippingAddress || {};
  if (Object.keys(shippingAddress).length > 0) {
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

/* ================= CREATE STRIPE ONBOARDING ================= */

export const createStripeOnboarding = onCall(async (request) => {
  const stripe = getStripeInstance();
  const uid = requireAuth(request);
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
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: "https://hobbydork.com/onboarding/terms",
    return_url: "https://hobbydork.com/onboarding/success",
    type: "account_onboarding",
  });
  return { url: link.url };
});

/* ================= FINALIZE SELLER ================= */

export const finalizeSeller = onCall(async (request) => {
  const stripe = getStripeInstance();
  const uid = requireAuth(request);
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const user = snap.data();
  if (!user?.stripeAccountId) {
    throw new HttpsError("failed-precondition", "Stripe not connected");
  }
  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  if (!account.details_submitted || !account.charges_enabled) {
    throw new HttpsError("failed-precondition", "Stripe onboarding incomplete");
  }
  const displayName = user.ownerDisplayName || user.displayName || "";
  const storeId = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  await userRef.update({
    isSeller: true,
    sellerStatus: "APPROVED",
    stripeOnboarded: true,
    stripeTermsAgreed: true,
    storeId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection("sellerApprovals").add({
    uid,
    email: user.email,
    displayName,
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    stripeAccountId: user.stripeAccountId,
  });
  return { ok: true, storeId };
});

/* ================= SECURE ORDER STATUS UPDATE ================= */

export const updateOrderStatus = onCall(async (request) => {
  try {
    const uid = requireAuth(request);
    const { orderId, updates } = request.data || {};
    if (!orderId || !updates || typeof updates !== "object") {
      throw new HttpsError("invalid-argument", "Missing orderId or updates");
    }
    const allowedFields = [
      "status",
      "trackingNumber",
      "shippingLabelUrl",
      "estimatedDelivery",
      "feedback",
      "updatedAt"
    ];
    const updateKeys = Object.keys(updates);
    if (!updateKeys.every((k) => allowedFields.includes(k))) {
      throw new HttpsError("permission-denied", "Attempt to update forbidden fields");
    }
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Order not found");
    }
    const order = orderSnap.data();
    if (!order) {
      throw new HttpsError("not-found", "Order data missing");
    }
    if (order.buyerUid !== uid && order.sellerUid !== uid) {
      throw new HttpsError("permission-denied", "Not authorized to update this order");
    }
    if (updates.status) {
      const validStatuses = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "DISPUTED"];
      if (!validStatuses.includes(updates.status)) {
        throw new HttpsError("invalid-argument", "Invalid status value");
      }
      if (updates.status === "SHIPPED" && order.sellerUid !== uid) {
        throw new HttpsError("permission-denied", "Only seller can mark as shipped");
      }
      if (updates.status === "DELIVERED" && order.buyerUid !== uid) {
        throw new HttpsError("permission-denied", "Only buyer can mark as delivered");
      }
    }
    if (updates.feedback && typeof updates.feedback !== "string") {
      throw new HttpsError("invalid-argument", "Feedback must be a string");
    }
    if (updates.shippingLabelUrl && typeof updates.shippingLabelUrl !== "string") {
      throw new HttpsError("invalid-argument", "Shipping label URL must be a string");
    }
    await orderRef.update(updates);
    await logAudit("order-status-update", {
      orderId: orderId,
      updatedBy: uid,
      updates,
      role: order.buyerUid === uid ? "buyer" : order.sellerUid === uid ? "seller" : "unknown",
    });
    if (updates.status) {
      if (updates.status === "SHIPPED") {
        await sendNotification(order.buyerUid, "ORDER", "Order shipped", `Your order #${orderId} has shipped.`, orderId);
      }
      if (updates.status === "DELIVERED") {
        await sendNotification(order.sellerUid, "ORDER", "Order delivered", `Order #${orderId} was marked delivered by buyer.`, orderId);
      }
      if (updates.status === "CANCELLED") {
        await sendNotification(order.buyerUid, "ORDER", "Order cancelled", `Order #${orderId} was cancelled.`, orderId);
        await sendNotification(order.sellerUid, "ORDER", "Order cancelled", `Order #${orderId} was cancelled.`, orderId);
      }
      if (updates.status === "REFUNDED") {
        await sendNotification(order.buyerUid, "ORDER", "Order refunded", `Order #${orderId} was refunded.`, orderId);
      }
      if (updates.status === "DISPUTED") {
        await sendNotification(order.sellerUid, "ORDER", "Order disputed", `Order #${orderId} was disputed by buyer.`, orderId);
      }
    }
    return { ok: true };
  } catch (error) {
    const orderId = request.data?.orderId || null;
    await logError(error instanceof Error ? error : String(error), { function: "updateOrderStatus", orderId });
    throw error;
  }
});