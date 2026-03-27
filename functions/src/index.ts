import { onCall, HttpsError } from "firebase-functions/v2/https";
import { db, admin } from "./firebaseAdmin";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";
export { getStripePayouts } from "./getStripePayouts";
export { createBlindBidAuction, submitBlindBid } from "./blindBidder";
export { stripeWebhook } from "./stripeWebhook";
export { shippoWebhook } from "./shippoWebhook";
export { dailySellerEnforcement } from "./dailySellerEnforcement";
export { createAuction, placeBid, closeAuction, closeListingAuctions } from "./auctions";
export { endExpiredGiveaways, onCreateGiveaway, drawGiveawayWinner } from "./giveaway";
import * as functions from "firebase-functions";

// ...existing code...

// Use environment variable for Stripe secret, fallback to functions.config for legacy support
const stripeSecretParam = defineSecret("STRIPE_SECRET");

/* ================= HELPERS ================= */

function getStripeInstance() {
  // Access secret inside the function, not at module load time (Firebase v2 requirement)
  const stripeSecret = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new HttpsError("internal", "Stripe secret not set in Firebase config");
  }
  return new Stripe(stripeSecret, { apiVersion: "2023-10-16" });
}
function requireAuth(request: any) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Auth required");
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

export const getStripeAccount = onCall({ secrets: [stripeSecretParam] }, async (request) => {
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
export const createAuctionFeeCheckoutSession = onCall({ secrets: [stripeSecretParam] }, async (request) => {
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

export const createCheckoutSession = onCall({ secrets: [stripeSecretParam] }, async (request) => {
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

export const createStripeOnboarding = onCall({ secrets: [stripeSecretParam] }, async (request) => {
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
  // Always use production base URL for onboarding
  const appBaseUrl = "https://hobbydork.com";
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appBaseUrl}/onboarding/terms`,
    return_url: `${appBaseUrl}/seller/onboarding?step=6`,
    type: "account_onboarding",
  });
  return { url: link.url };
});

/* ================= FINALIZE SELLER ================= */

export const finalizeSeller = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  const stripe = getStripeInstance();
  const uid = requireAuth(request);
  // Validate Firestore path inputs
  if (!uid || typeof uid !== "string" || uid.includes("..") || uid.includes("/")) {
    console.error("Invalid UID for Firestore path", { uid });
    throw new HttpsError("invalid-argument", "Invalid UID for Firestore path");
  }
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const user = snap.data();
  if (!user?.stripeAccountId) {
    console.error("Stripe not connected", { uid, user });
    throw new HttpsError("failed-precondition", "Stripe not connected");
  }
  const account = await stripe.accounts.retrieve(user.stripeAccountId);
  if (!account.details_submitted || !account.charges_enabled) {
    console.error("Stripe onboarding incomplete", { uid, stripeAccountId: user.stripeAccountId, account });
    throw new HttpsError("failed-precondition", "Stripe onboarding incomplete");
  }
  const username = user.username;
  if (!username || typeof username !== "string" || username.includes("..") || username.includes("/")) {
    console.error("Invalid username for Firestore path", { username });
    throw new HttpsError("failed-precondition", "Username (handle) missing or invalid");
  }
  // Ensure user is marked as verified and seller for Firestore rules
  await userRef.update({
    emailVerified: true,
    status: "ACTIVE",
    isSeller: true,
  });
  const storeId = username;
  const storeRef = db.collection("storefronts").doc(storeId);
  const storeSnap = await storeRef.get();
  if (!storeSnap.exists) {
    await storeRef.set({
      id: storeId,
      ownerUid: uid,
      displayName: username,
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
    displayName: username,
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    stripeAccountId: user.stripeAccountId,
  });
  console.log("finalizeSeller success", { uid, storeId });
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
      "returnTrackingNumber",
      "returnId",
      "carrier",
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
/**
 * Cancel late order - Buyer can cancel if seller hasn't shipped within 2 business days
 * Automatically refunds buyer and penalizes seller
 */
export const cancelLateOrder = onCall({ secrets: [stripeSecretParam] }, async (request) => {
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

    // Only buyer can cancel their own order
    if (order.buyerUid !== uid) {
      throw new HttpsError("permission-denied", "Only buyer can cancel this order");
    }

    // Check if order is eligible for cancellation
    // Allow if: (1) Order is still in Confirmed status (early cancel) OR (2) buyerCanCancel flag is set (late cancel)
    const isEarlyCancel = order.status === "Confirmed";
    const isLateCancel = order.buyerCanCancel === true;
    
    if (!isEarlyCancel && !isLateCancel) {
      throw new HttpsError("failed-precondition", "Order is not eligible for cancellation. Buyers can cancel before processing starts or if seller fails to ship within 2 business days.");
    }

    // Can only cancel orders that haven't shipped yet
    if (order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "CANCELLED" || order.status === "REFUNDED") {
      throw new HttpsError("failed-precondition", "Order cannot be cancelled in current status");
    }

    const stripe = getStripeInstance();
    
    if (!order.stripePaymentIntentId) {
      throw new HttpsError("failed-precondition", "No payment intent found for this order");
    }

    // Retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {
      expand: ['charges']
    }) as any;
    
    if (!paymentIntent.charges || !paymentIntent.charges.data || paymentIntent.charges.data.length === 0) {
      throw new HttpsError("failed-precondition", "No charge found for this payment intent");
    }

    const chargeId = paymentIntent.charges.data[0].id;
    const refundAmount = Math.round(order.price * 100); // Convert to cents

    // Create full refund in Stripe
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        orderId: orderId,
        cancellationReason: 'Late shipping - seller failed to ship within 48 hours'
      }
    });

    if (refund.status !== "succeeded") {
      throw new HttpsError("internal", "Refund processing failed");
    }

    const cancellationReason = isEarlyCancel 
      ? "Buyer cancelled before seller started processing"
      : "Late shipping - no tracking after 2 business days";

    // Update order status to Cancelled with refund info
    await orderRef.update({
      status: "CANCELLED",
      cancelledBy: "buyer",
      cancellationReason,
      refundId: refund.id,
      refundAmount: order.price,
      refundDate: admin.firestore.FieldValue.serverTimestamp(),
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notifications
    await sendNotification(order.buyerUid, "ORDER", "Order Cancelled & Refunded", `Order #${orderId.substring(0, 8)} has been cancelled. Your refund of $${order.price} will appear in 3-5 business days.`, orderId);
    
    const sellerNotificationTitle = isLateCancel ? "Order Cancelled for Late Shipping" : "Order Cancelled";
    const sellerNotificationMessage = isLateCancel 
      ? `Order #${orderId.substring(0, 8)} was cancelled by the buyer due to late shipping. This affects your seller rating.`
      : `Order #${orderId.substring(0, 8)} was cancelled by the buyer.`;
    
    await sendNotification(order.sellerUid, "ORDER", sellerNotificationTitle, sellerNotificationMessage, orderId);

    // Log the cancellation
    const auditAction = isLateCancel ? "order-cancelled-late-shipping" : "order-cancelled-by-buyer";
    await logAudit(auditAction, {
      orderId,
      buyerId: uid,
      sellerId: order.sellerUid,
      amount: order.price,
      stripeRefundId: refund.id,
      reason: cancellationReason,
      timestamp: new Date().toISOString()
    });

    return { ok: true, refundId: refund.id, message: "Order cancelled and refund processed" };
  } catch (error) {
    await logError(error instanceof Error ? error : String(error), { function: "cancelLateOrder" });
    throw error;
  }
});

export const processRefund = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  try {
    // Log the incoming request for debugging
    console.log("processRefund request", {
      auth: request.auth,
      data: request.data
    });
    const uid = requireAuth(request);
    const { orderId } = request.data || {};

    if (!orderId || typeof orderId !== "string" || orderId.includes("..") || orderId.includes("/")) {
      console.error("Invalid or missing orderId", { orderId });
      throw new HttpsError("invalid-argument", "Valid orderId required");
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    const order = orderSnap.data();

    if (!order) {
      console.error("Order not found", { orderId });
      throw new HttpsError("not-found", "Order not found");
    }

    // Only seller can process refund
    if (order.sellerUid !== uid) {
      console.error("Permission denied: not seller", { orderId, sellerUid: order.sellerUid, uid });
      throw new HttpsError("permission-denied", "Only seller can process refund");
    }

    // Check if order is in Return Shipped status
    if (order.status !== "Return Shipped") {
      console.error("Order not in Return Shipped status", { orderId, status: order.status });
      throw new HttpsError("failed-precondition", "Order must be in Return Shipped status");
    }

    // Get the payment intent ID from Stripe metadata
    const stripe = getStripeInstance();
    if (!order.stripePaymentIntentId) {
      console.error("No payment intent for order", { orderId });
      throw new HttpsError("failed-precondition", "No payment intent found for this order");
    }

    // Retrieve the payment intent to get the charge ID
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {
      expand: ['charges']
    }) as any; // Cast to any to access expanded charges

    if (!paymentIntent.charges || !paymentIntent.charges.data || paymentIntent.charges.data.length === 0) {
      console.error("No charge found for payment intent", { orderId, paymentIntent });
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
      console.error("Refund processing failed", { orderId, refund });
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

    console.log("processRefund success", { orderId, refundId: refund.id });
    return { ok: true, refundId: refund.id };
  } catch (error) {
    console.error("processRefund error", error);
    await logError(error instanceof Error ? error : String(error), { function: "processRefund" });
    throw error;
  }
});

/* ================= APPROVE WITHDRAWAL ================= */

export const approveWithdrawal = onCall({ secrets: [stripeSecretParam] }, async (request) => {
  try {
    // Log the incoming request for debugging
    console.log("approveWithdrawal request", {
      auth: request.auth,
      data: request.data
    });
    const uid = requireAuth(request);
    const { payoutRequestId } = request.data || {};

    if (!payoutRequestId || typeof payoutRequestId !== "string" || payoutRequestId.includes("..") || payoutRequestId.includes("/")) {
      console.error("Invalid or missing payoutRequestId", { payoutRequestId });
      throw new HttpsError("invalid-argument", "Valid payoutRequestId required");
    }

    // Verify user is admin
    const adminSnap = await db.collection("users").doc(uid).get();
    const admin = adminSnap.data();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR")) {
      console.error("Permission denied: not admin/moderator", { uid, role: admin?.role });
      throw new HttpsError("permission-denied", "Only admins can approve withdrawals");
    }

    const payoutRef = db.collection("payoutRequests").doc(payoutRequestId);
    const payoutSnap = await payoutRef.get();
    const payout = payoutSnap.data();

    if (!payout) {
      console.error("Payout request not found", { payoutRequestId });
      throw new HttpsError("not-found", "Payout request not found");
    }

    if (payout.status !== "PENDING") {
      console.error("Payout request not pending", { payoutRequestId, status: payout.status });
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

    console.log("approveWithdrawal success", { payoutRequestId, transferId: transfer.id });
    return { ok: true, transferId: transfer.id };
  } catch (error) {
    console.error("approveWithdrawal error", error);
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
    // Log the incoming request for debugging
    console.log("calculateSellerTier request", {
      auth: request.auth,
      data: request.data
    });
    const uid = requireAuth(request);
    const { sellerId } = request.data || {};
    const targetSellerId = sellerId || uid;

    if (!targetSellerId || typeof targetSellerId !== "string" || targetSellerId.includes("..") || targetSellerId.includes("/")) {
      console.error("Invalid or missing sellerId", { sellerId, targetSellerId });
      throw new HttpsError("invalid-argument", "Valid sellerId required");
    }

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

    console.log("calculateSellerTier success", { targetSellerId, tier });
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
    console.error("calculateSellerTier error", error);
    await logError(error instanceof Error ? error : String(error), { function: "calculateSellerTier" });
    throw error;
  }
});

export const moderateListingOnWrite = functions.firestore
  .document("listings/{listingId}")
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    const title = String(after.title || "");
    const description = String(after.description || "");
    const combinedText = `${title} ${description}`.toLowerCase();
    const tags = Array.isArray(after.tags) ? after.tags : [];

    const reasons: string[] = [];

    if (/(https?:\/\/|www\.|t\.me|telegram|whatsapp|dm me|text me|contact me)/i.test(combinedText)) {
      reasons.push("external-contact");
    }

    if (/(.)\1{6,}/.test(combinedText)) {
      reasons.push("repeated-characters");
    }

    if (tags.length > 20) {
      reasons.push("excessive-tags");
    }

    const alphaChars = title.replace(/[^A-Za-z]/g, "");
    const uppercaseChars = alphaChars.replace(/[^A-Z]/g, "");
    if (alphaChars.length >= 20 && uppercaseChars.length / alphaChars.length > 0.7) {
      reasons.push("excessive-uppercase");
    }

    const nextModerationStatus = reasons.length > 0 ? "FLAGGED" : "APPROVED";
    const shouldHide = reasons.length > 0;

    const moderationUnchanged =
      after.moderationStatus === nextModerationStatus &&
      JSON.stringify(after.moderationReasons || []) === JSON.stringify(reasons) &&
      (!shouldHide || after.visibility === "Invisible");

    if (moderationUnchanged) {
      return null;
    }

    const patch: Record<string, any> = {
      moderationStatus: nextModerationStatus,
      moderationReasons: reasons,
      moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (shouldHide) {
      patch.visibility = "Invisible";
    }

    await change.after.ref.update(patch);

    if (shouldHide && after.sellerId) {
      await sendNotification(
        String(after.sellerId),
        "LISTING_MODERATION",
        "Listing flagged for review",
        "Your listing was temporarily hidden while moderation reviews it.",
        context.params.listingId
      );
    }

    return null;
  });