import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "./firebaseAdmin";
import Stripe from "stripe";
export { getStripePayouts } from "./getStripePayouts";
export { createBlindBidAuction, submitBlindBid } from "./blindBidder";
export { setBlindBidAuctionImage } from "./blindBidder";
export { stripeWebhook } from "./stripeWebhook";
export { shippoWebhook } from "./shippoWebhook";
export { dailySellerEnforcement } from "./dailySellerEnforcement";
export { createAuction, placeBid, closeAuction } from "./auctions";
import * as functions from "firebase-functions";

// ...existing code...

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
  const { orderId, listingId, listingTitle, amountCents, appBaseUrl } = request.data || {};
  if (!orderId || !listingTitle || !amountCents || !appBaseUrl) {
    throw new HttpsError("invalid-argument", "Missing required parameters");
  }
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.data();
  const userAddress = userData?.shippingAddress || {};
  // Map user address fields to order address fields
  const shippingAddress = {
    name: userAddress.name || "",
    line1: userAddress.address1 || "",
    line2: userAddress.address2 || "",
    city: userAddress.city || "",
    state: userAddress.state || "",
    postalCode: userAddress.zip || "",
    country: userAddress.country || "",
  };
  // Store order info with listing details
  const orderData: any = {
    buyerUid: uid,
    listingId: listingId || "",
    listingTitle,
    amount: amountCents,
    status: "PENDING",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  if (shippingAddress.line1 && shippingAddress.city && shippingAddress.state && shippingAddress.postalCode) {
    orderData.shippingAddress = shippingAddress;
  }
  
  await db.collection("orders").doc(orderId).set(orderData, { merge: true });
  
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
    success_url: `${appBaseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&item_id=${orderId}`,
    metadata: {
      orderId,
      listingId: listingId || "",
      buyerUid: uid,
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
  const appBaseUrl = request.data?.appBaseUrl || "https://hobbydork.com";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appBaseUrl}/onboarding/terms`,
    return_url: `${appBaseUrl}/seller/onboarding?step=5`,
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
  const storeRef = db.collection("storefronts").doc(storeId);
  const storeSnap = await storeRef.get();
  if (!storeSnap.exists) {
    await storeRef.set({
      id: storeId,
      ownerUid: uid,
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
      const validStatuses = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "DISPUTED", "Confirmed", "Processing", "Return Requested", "Return Approved", "Return Shipped", "Delivered"];
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

/**
 * Process refund for an order
 * Called when seller confirms return receipt and initiates refund
 */
export const processRefund = onCall({ secrets: ["STRIPE_SECRET"] }, async (request) => {
  try {
    const uid = requireAuth(request);
    const { orderId } = request.data;

    if (!orderId) {
      throw new HttpsError("invalid-argument", "Order ID required");
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    const order = orderSnap.data();

    if (!order) {
      throw new HttpsError("not-found", "Order not found");
    }

    // Only seller can process refund
    if (order.sellerUid !== uid) {
      throw new HttpsError("permission-denied", "Only seller can process refund");
    }

    // Check if order is in Return Shipped status
    if (order.status !== "Return Shipped") {
      throw new HttpsError("failed-precondition", "Order must be in Return Shipped status");
    }

    // Get the payment intent ID from Stripe metadata
    const stripe = getStripeInstance();
    
    if (!order.stripePaymentIntentId) {
      throw new HttpsError("failed-precondition", "No payment intent found for this order");
    }

    // Retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {
      expand: ['charges']
    }) as any; // Cast to any to access expanded charges
    
    if (!paymentIntent.charges || !paymentIntent.charges.data || paymentIntent.charges.data.length === 0) {
      throw new HttpsError("failed-precondition", "No charge found for this payment intent");
    }

    const chargeId = paymentIntent.charges.data[0].id;
    const refundAmount = Math.round(order.price * 100); // Convert to cents

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: refundAmount,
      metadata: {
        orderId: orderId,
        returnId: order.returnId
      }
    });

    if (refund.status !== "succeeded") {
      throw new HttpsError("internal", "Refund processing failed");
    }

    // Update order status to Refunded
    await orderRef.update({
      status: "Refunded",
      refundId: refund.id,
      refundAmount: order.price,
      refundDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notifications
    await sendNotification(order.buyerUid, "ORDER", "Refund Processed", `Your refund of $${order.price} has been processed. Funds will appear in 3-5 business days.`, orderId);
    await sendNotification(order.sellerUid, "ORDER", "Refund Sent", `Refund of $${order.price} sent to buyer for order #${orderId.substring(0, 8)}.`, orderId);

    // Log the refund
    await logAudit("refund-processed", {
      orderId,
      sellerId: uid,
      amount: order.price,
      stripeRefundId: refund.id,
      timestamp: new Date().toISOString()
    });

    return { ok: true, refundId: refund.id };
  } catch (error) {
    await logError(error instanceof Error ? error : String(error), { function: "processRefund" });
    throw error;
  }
});

/* ================= APPROVE WITHDRAWAL ================= */

export const approveWithdrawal = onCall({ secrets: ["STRIPE_SECRET"] }, async (request) => {
  try {
    const uid = requireAuth(request);
    const { payoutRequestId } = request.data;

    if (!payoutRequestId) {
      throw new HttpsError("invalid-argument", "Payout request ID required");
    }

    // Verify user is admin
    const adminSnap = await db.collection("users").doc(uid).get();
    const admin = adminSnap.data();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR")) {
      throw new HttpsError("permission-denied", "Only admins can approve withdrawals");
    }

    const payoutRef = db.collection("payoutRequests").doc(payoutRequestId);
    const payoutSnap = await payoutRef.get();
    const payout = payoutSnap.data();

    if (!payout) {
      throw new HttpsError("not-found", "Payout request not found");
    }

    if (payout.status !== "PENDING") {
      throw new HttpsError("failed-precondition", "Only PENDING requests can be approved");
    }

    const stripe = getStripeInstance();
    const amount = Math.round(payout.amount * 100); // Convert to cents

    // Create transfer to seller's connected account
    const transfer = await stripe.transfers.create({
      amount,
      currency: "usd",
      destination: payout.stripeAccountId,
      metadata: {
        payoutRequestId,
        sellerUid: payout.sellerUid
      },
      description: `Withdrawal request from studio seller ${payout.sellerUsername}`
    });

    // Wait a moment for transfer to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retrieve the transfer to check status
    const completedTransfer = await stripe.transfers.retrieve(transfer.id) as any;
    if (completedTransfer.status !== "succeeded" && completedTransfer.status !== "paid") {
      throw new HttpsError("internal", "Transfer failed");
    }

    // Update payout request status to APPROVED
    await payoutRef.update({
      status: "APPROVED",
      stripeTransferId: transfer.id,
      approvedBy: uid,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to seller
    await sendNotification(
      payout.sellerUid,
      "PAYMENT",
      "Withdrawal Approved",
      `Your withdrawal request of $${payout.amount} has been approved and transferred to your Stripe account.`,
      payoutRequestId
    );

    // Log the approval
    await logAudit("withdrawal-approved", {
      payoutRequestId,
      sellerUid: payout.sellerUid,
      amount: payout.amount,
      stripeTransferId: transfer.id,
      approvedBy: uid,
      timestamp: new Date().toISOString()
    });

    return { ok: true, transferId: transfer.id };
  } catch (error) {
    await logError(error instanceof Error ? error : String(error), { function: "approveWithdrawal" });
    throw error;
  }
});

/* ================= DENY WITHDRAWAL ================= */

export const denyWithdrawal = onCall(async (request) => {
  try {
    const uid = requireAuth(request);
    const { payoutRequestId, reason } = request.data;

    if (!payoutRequestId) {
      throw new HttpsError("invalid-argument", "Payout request ID required");
    }

    // Verify user is admin
    const adminSnap = await db.collection("users").doc(uid).get();
    const admin = adminSnap.data();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR")) {
      throw new HttpsError("permission-denied", "Only admins can deny withdrawals");
    }

    const payoutRef = db.collection("payoutRequests").doc(payoutRequestId);
    const payoutSnap = await payoutRef.get();
    const payout = payoutSnap.data();

    if (!payout) {
      throw new HttpsError("not-found", "Payout request not found");
    }

    if (payout.status !== "PENDING") {
      throw new HttpsError("failed-precondition", "Only PENDING requests can be denied");
    }

    // Update payout request status to DENIED
    await payoutRef.update({
      status: "DENIED",
      denialReason: reason || "No reason provided",
      deniedBy: uid,
      deniedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to seller
    await sendNotification(
      payout.sellerUid,
      "PAYMENT",
      "Withdrawal Denied",
      `Your withdrawal request of $${payout.amount} has been denied. Reason: ${reason || "See admin notes"}`,
      payoutRequestId
    );

    // Log the denial
    await logAudit("withdrawal-denied", {
      payoutRequestId,
      sellerUid: payout.sellerUid,
      amount: payout.amount,
      reason,
      deniedBy: uid,
      timestamp: new Date().toISOString()
    });

    return { ok: true };
  } catch (error) {
    await logError(error instanceof Error ? error : String(error), { function: "denyWithdrawal" });
    throw error;
  }
});

/* ================= CALCULATE SELLER TIER ================= */

export const calculateSellerTier = onCall(async (request) => {
  try {
    const uid = requireAuth(request);
    const { sellerId } = request.data || {};
    const targetSellerId = sellerId || uid;

    // Fetch all orders for this seller
    const ordersSnap = await db
      .collection("orders")
      .where("sellerUid", "==", targetSellerId)
      .get();

    const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Array<{ id: string; status?: string; [key: string]: any }>;

    // Count completed sales (Delivered or Refunded status)
    const completedSales = orders.filter(o => 
      o.status === 'Delivered' || o.status === 'Refunded'
    );

    // Get returns for this seller
    const returnsSnap = await db
      .collection("returns")
      .where("sellerUid", "==", targetSellerId)
      .get();

    const totalReturns = returnsSnap.size;
    const approvedReturns = returnsSnap.docs.filter(doc => {
      const returnData = doc.data();
      return returnData.status === 'Return Shipped' || returnData.status === 'Refunded';
    }).length;

    // Count refunded orders
    const refundedOrders = completedSales.filter(o => o.status === 'Refunded').length;

    // Calculate rates
    const completedCount = completedSales.length;
    const returnRate = completedCount > 0 ? (approvedReturns / completedCount) * 100 : 0;
    const refundRate = completedCount > 0 ? (refundedOrders / completedCount) * 100 : 0;

    // Determine tier based on thresholds
    let tier = 'Bronze';

    if (completedCount >= 200) {
      if (returnRate < 2 && refundRate < 2) {
        tier = 'Platinum';
      } else if (returnRate < 5 && refundRate < 5) {
        tier = 'Gold';
      } else {
        tier = 'Silver';
      }
    } else if (completedCount >= 50) {
      tier = 'Silver';
    } else {
      tier = 'Bronze';
    }

    // Update user profile with tier and metrics
    const userRef = db.collection("users").doc(targetSellerId);
    await userRef.update({
      sellerTier: tier,
      tierLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      tierMetrics: {
        completedSales: completedCount,
        totalReturns,
        approvedReturns,
        refundedOrders,
        returnRate: Math.round(returnRate * 100) / 100,
        refundRate: Math.round(refundRate * 100) / 100,
        calculatedAt: new Date().toISOString()
      }
    });

    // Log audit
    await logAudit("tier-calculated", {
      sellerId: targetSellerId,
      previousTier: null, // Could fetch this for comparison
      newTier: tier,
      metrics: {
        completedSales: completedCount,
        returnRate,
        refundRate
      },
      timestamp: new Date().toISOString()
    });

    return { 
      ok: true, 
      tier,
      metrics: {
        completedSales: completedCount,
        returnRate: Math.round(returnRate * 100) / 100,
        refundRate: Math.round(refundRate * 100) / 100
      }
    };
  } catch (error) {
    await logError(error instanceof Error ? error : String(error), { function: "calculateSellerTier" });
    throw error;
  }
});