"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.finalizeSeller = exports.createStripeOnboarding = exports.createCheckoutSession = exports.createAuctionFeeCheckoutSession = exports.getStripeAccount = exports.stripeWebhook = exports.setBlindBidAuctionImage = exports.submitBlindBid = exports.createBlindBidAuction = exports.getStripePayouts = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebaseAdmin_1 = require("./firebaseAdmin");
const stripe_1 = __importDefault(require("stripe"));
var getStripePayouts_1 = require("./getStripePayouts");
Object.defineProperty(exports, "getStripePayouts", { enumerable: true, get: function () { return getStripePayouts_1.getStripePayouts; } });
var blindBidder_1 = require("./blindBidder");
Object.defineProperty(exports, "createBlindBidAuction", { enumerable: true, get: function () { return blindBidder_1.createBlindBidAuction; } });
Object.defineProperty(exports, "submitBlindBid", { enumerable: true, get: function () { return blindBidder_1.submitBlindBid; } });
var blindBidder_2 = require("./blindBidder");
Object.defineProperty(exports, "setBlindBidAuctionImage", { enumerable: true, get: function () { return blindBidder_2.setBlindBidAuctionImage; } });
var stripeWebhook_1 = require("./stripeWebhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripeWebhook_1.stripeWebhook; } });
const functions = __importStar(require("firebase-functions"));
// Use environment variable for Stripe secret, fallback to functions.config for legacy support
const config = typeof functions.config === "object" ? functions.config : {};
const stripeSecret = process.env.STRIPE_SECRET || (config.stripe && config.stripe.secret); /* ================= HELPERS ================= */
function getStripeInstance() {
    if (!stripeSecret) {
        throw new https_1.HttpsError("internal", "Stripe secret not set in Firebase config");
    }
    return new stripe_1.default(stripeSecret, { apiVersion: "2023-10-16" });
}
function requireAuth(request) {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    return uid;
}
/**
 * Audit log helper for sensitive actions
 */
async function logAudit(action, context) {
    await firebaseAdmin_1.db.collection("auditLogs").add({
        action,
        ...context,
        timestamp: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Helper to send notification to user
 */
async function sendNotification(uid, type, title, body, relatedId) {
    await firebaseAdmin_1.db.collection("users").doc(uid).collection("notifications").add({
        type,
        title,
        body,
        relatedId,
        read: false,
        createdAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Error monitoring: log backend errors to Firestore for alerting
 */
async function logError(error, context = {}) {
    await firebaseAdmin_1.db.collection("errorLogs").add({
        error: typeof error === "string" ? error : error.message,
        stack: typeof error === "string" ? undefined : error.stack,
        ...context,
        timestamp: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
    });
}
/* ================= GET STRIPE ACCOUNT DETAILS ================= */
exports.getStripeAccount = (0, https_1.onCall)(async (request) => {
    const stripe = getStripeInstance();
    const { accountId } = request.data || {};
    if (!accountId) {
        throw new https_1.HttpsError("invalid-argument", "Missing accountId");
    }
    try {
        const account = await stripe.accounts.retrieve(accountId);
        let dashboardUrl = undefined;
        try {
            const loginLink = await stripe.accounts.createLoginLink(accountId);
            dashboardUrl = loginLink.url;
        }
        catch (err) {
            dashboardUrl = undefined;
        }
        return {
            email: account.email,
            details_submitted: account.details_submitted,
            charges_enabled: account.charges_enabled,
            dashboardUrl,
        };
    }
    catch (err) {
        throw new https_1.HttpsError("internal", err.message || "Failed to fetch Stripe account");
    }
});
/* ========== CREATE AUCTION FEE CHECKOUT SESSION ========== */
exports.createAuctionFeeCheckoutSession = (0, https_1.onCall)(async (request) => {
    const stripe = getStripeInstance();
    const uid = requireAuth(request);
    const { auctionId, auctionTitle, amountCents, appBaseUrl } = request.data || {};
    if (!auctionId || !auctionTitle || !amountCents || !appBaseUrl) {
        throw new https_1.HttpsError("invalid-argument", "Missing required parameters");
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
exports.createCheckoutSession = (0, https_1.onCall)(async (request) => {
    const stripe = getStripeInstance();
    const uid = requireAuth(request);
    const { orderId, listingTitle, amountCents, appBaseUrl } = request.data || {};
    if (!orderId || !listingTitle || !amountCents || !appBaseUrl) {
        throw new https_1.HttpsError("invalid-argument", "Missing required parameters");
    }
    const userSnap = await firebaseAdmin_1.db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    const shippingAddress = userData?.shippingAddress || {};
    if (Object.keys(shippingAddress).length > 0) {
        await firebaseAdmin_1.db.collection("orders").doc(orderId).set({ shippingAddress }, { merge: true });
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
exports.createStripeOnboarding = (0, https_1.onCall)(async (request) => {
    const stripe = getStripeInstance();
    const uid = requireAuth(request);
    const userRef = firebaseAdmin_1.db.collection("users").doc(uid);
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
        await userRef.set({
            stripeAccountId: accountId,
            sellerStatus: "PENDING",
            isSeller: false,
            updatedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
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
exports.finalizeSeller = (0, https_1.onCall)(async (request) => {
    const stripe = getStripeInstance();
    const uid = requireAuth(request);
    const userRef = firebaseAdmin_1.db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();
    if (!user?.stripeAccountId) {
        throw new https_1.HttpsError("failed-precondition", "Stripe not connected");
    }
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    if (!account.details_submitted || !account.charges_enabled) {
        throw new https_1.HttpsError("failed-precondition", "Stripe onboarding incomplete");
    }
    const displayName = user.ownerDisplayName || user.displayName || "";
    const storeId = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const storeRef = firebaseAdmin_1.db.collection("stores").doc(storeId);
    const storeSnap = await storeRef.get();
    if (!storeSnap.exists) {
        await storeRef.set({
            id: storeId,
            ownerId: uid,
            displayName,
            createdAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
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
        updatedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
    });
    await firebaseAdmin_1.db.collection("sellerApprovals").add({
        uid,
        email: user.email,
        displayName,
        approvedAt: firebaseAdmin_1.admin.firestore.FieldValue.serverTimestamp(),
        stripeAccountId: user.stripeAccountId,
    });
    return { ok: true, storeId };
});
/* ================= SECURE ORDER STATUS UPDATE ================= */
exports.updateOrderStatus = (0, https_1.onCall)(async (request) => {
    try {
        const uid = requireAuth(request);
        const { orderId, updates } = request.data || {};
        if (!orderId || !updates || typeof updates !== "object") {
            throw new https_1.HttpsError("invalid-argument", "Missing orderId or updates");
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
            throw new https_1.HttpsError("permission-denied", "Attempt to update forbidden fields");
        }
        const orderRef = firebaseAdmin_1.db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new https_1.HttpsError("not-found", "Order not found");
        }
        const order = orderSnap.data();
        if (!order) {
            throw new https_1.HttpsError("not-found", "Order data missing");
        }
        if (order.buyerUid !== uid && order.sellerUid !== uid) {
            throw new https_1.HttpsError("permission-denied", "Not authorized to update this order");
        }
        if (updates.status) {
            const validStatuses = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "DISPUTED"];
            if (!validStatuses.includes(updates.status)) {
                throw new https_1.HttpsError("invalid-argument", "Invalid status value");
            }
            if (updates.status === "SHIPPED" && order.sellerUid !== uid) {
                throw new https_1.HttpsError("permission-denied", "Only seller can mark as shipped");
            }
            if (updates.status === "DELIVERED" && order.buyerUid !== uid) {
                throw new https_1.HttpsError("permission-denied", "Only buyer can mark as delivered");
            }
        }
        if (updates.feedback && typeof updates.feedback !== "string") {
            throw new https_1.HttpsError("invalid-argument", "Feedback must be a string");
        }
        if (updates.shippingLabelUrl && typeof updates.shippingLabelUrl !== "string") {
            throw new https_1.HttpsError("invalid-argument", "Shipping label URL must be a string");
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
    }
    catch (error) {
        const orderId = request.data?.orderId || null;
        await logError(error instanceof Error ? error : String(error), { function: "updateOrderStatus", orderId });
        throw error;
    }
});
