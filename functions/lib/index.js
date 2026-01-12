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
exports.stripeWebhook = exports.updateOrderStatus = exports.finalizeSeller = exports.createStripeOnboarding = exports.createCheckoutSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
const db = admin.firestore();
/* ================= CREATE STRIPE CHECKOUT SESSION ================= */
exports.createCheckoutSession = (0, https_1.onCall)({
    region: "us-central1",
    secrets: ["STRIPE_SECRET", "APP_BASE_URL"],
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    const { orderId, listingTitle, amountCents, appBaseUrl } = request.data || {};
    if (!orderId || !listingTitle || !amountCents || !appBaseUrl) {
        throw new https_1.HttpsError("invalid-argument", "Missing required parameters");
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
});
/* ================= HELPERS ================= */
/**
 * Audit log helper for sensitive actions
 */
async function logAudit(action, context) {
    await db.collection("auditLogs").add({
        action,
        ...context,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}
/**
 * Helper to send notification to user
 */
async function sendNotification(uid, type, title, body, relatedId) {
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
async function logError(error, context = {}) {
    await db.collection("errorLogs").add({
        error: typeof error === "string" ? error : error.message,
        stack: typeof error === "string" ? undefined : error.stack,
        ...context,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
}
/* ================= STRIPE ================= */
const stripe = new stripe_1.default(process.env.STRIPE_SECRET, {
    apiVersion: "2023-10-16",
});
/* ================= CREATE STRIPE ONBOARDING ================= */
exports.createStripeOnboarding = (0, https_1.onCall)({
    region: "us-central1",
    secrets: ["STRIPE_SECRET", "APP_BASE_URL"],
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
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
        await userRef.set({
            stripeAccountId: accountId,
            sellerStatus: "PENDING",
            isSeller: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    const baseUrl = process.env["app.base_url"] || "http://localhost:9002";
    const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${baseUrl}/onboarding/terms`,
        return_url: `${baseUrl}/onboarding/success`,
        type: "account_onboarding",
    });
    return { url: link.url };
});
/* ================= FINALIZE SELLER ================= */
exports.finalizeSeller = (0, https_1.onCall)({
    region: "us-central1",
    secrets: ["STRIPE_SECRET"],
}, async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    const user = snap.data();
    if (!user?.stripeAccountId) {
        throw new https_1.HttpsError("failed-precondition", "Stripe not connected");
    }
    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    if (!account.details_submitted || !account.charges_enabled) {
        throw new https_1.HttpsError("failed-precondition", "Stripe onboarding incomplete");
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
});
/* ================= SECURE ORDER STATUS UPDATE ================= */
exports.updateOrderStatus = (0, https_1.onCall)({
    region: "us-central1",
}, async (request) => {
    try {
        const uid = request.auth?.uid;
        if (!uid)
            throw new https_1.HttpsError("unauthenticated", "Auth required");
        if (!request.auth || request.auth.token.email_verified !== true) {
            throw new https_1.HttpsError("failed-precondition", "Email verification required");
        }
        const { orderId, updates } = request.data || {};
        if (!orderId || !updates || typeof updates !== "object") {
            throw new https_1.HttpsError("invalid-argument", "Missing orderId or updates");
        }
        // Only allow specific fields
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
        // Fetch order
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new https_1.HttpsError("not-found", "Order not found");
        }
        const order = orderSnap.data();
        if (!order) {
            throw new https_1.HttpsError("not-found", "Order data missing");
        }
        // Only buyer or seller can update
        if (order.buyerUid !== uid && order.sellerUid !== uid) {
            throw new https_1.HttpsError("permission-denied", "Not authorized to update this order");
        }
        // Validate status transitions (example: only allow certain transitions)
        if (updates.status) {
            const validStatuses = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "DISPUTED"];
            if (!validStatuses.includes(updates.status)) {
                throw new https_1.HttpsError("invalid-argument", "Invalid status value");
            }
            // Example: only seller can mark as SHIPPED
            if (updates.status === "SHIPPED" && order.sellerUid !== uid) {
                throw new https_1.HttpsError("permission-denied", "Only seller can mark as shipped");
            }
            // Only buyer can mark as DELIVERED
            if (updates.status === "DELIVERED" && order.buyerUid !== uid) {
                throw new https_1.HttpsError("permission-denied", "Only buyer can mark as delivered");
            }
        }
        // Validate feedback (if present)
        if (updates.feedback && typeof updates.feedback !== "string") {
            throw new https_1.HttpsError("invalid-argument", "Feedback must be a string");
        }
        // Validate shippingLabelUrl (if present)
        if (updates.shippingLabelUrl && typeof updates.shippingLabelUrl !== "string") {
            throw new https_1.HttpsError("invalid-argument", "Shipping label URL must be a string");
        }
        // Perform update
        await orderRef.update(updates);
        await logAudit("order-status-update", {
            orderId: orderId,
            updatedBy: uid,
            updates,
            role: order.buyerUid === uid ? "buyer" : order.sellerUid === uid ? "seller" : "unknown",
        });
        // Send notifications based on status change
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
var stripeWebhook_1 = require("./stripeWebhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripeWebhook_1.stripeWebhook; } });
