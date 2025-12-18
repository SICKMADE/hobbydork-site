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
exports.awardIsoTrophy = exports.getStripePayouts = exports.onboardStripe = exports.stripeWebhook = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
const db = admin.firestore();
/**
 * APP_BASE_URL should be provided via environment in production.
 * Fallback order:
 *  - process.env.APP_BASE_URL
 *  - process.env.NEXT_PUBLIC_URL
 *  - localhost (development)
 */
const APP_BASE_URL = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_URL || "http://localhost:9002";
function tryNormalizeOrigin(raw) {
    if (typeof raw !== "string")
        return null;
    const trimmed = raw.trim();
    if (!trimmed)
        return null;
    // Support accidental values like "localhost:9002" (no protocol)
    const candidate = /^localhost(?::\d+)?(\/|$)/i.test(trimmed) || /^[\w.-]+:\d+(\/|$)/.test(trimmed)
        ? `http://${trimmed}`
        : trimmed;
    try {
        const url = new URL(candidate);
        if (url.protocol !== "http:" && url.protocol !== "https:")
            return null;
        return url.origin;
    }
    catch {
        return null;
    }
}
function resolveAppBaseUrl(maybeBaseUrl, requestOriginHeader, requestRefererHeader) {
    // If client explicitly sent appBaseUrl, validate it strictly.
    if (typeof maybeBaseUrl === "string" && maybeBaseUrl.trim().length > 0) {
        const normalized = tryNormalizeOrigin(maybeBaseUrl);
        if (!normalized) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid appBaseUrl. Expected an absolute URL like https://example.com or http://localhost:9002");
        }
        return normalized;
    }
    // Fallback to callable request headers (usually correct for local dev ports).
    const fromOrigin = tryNormalizeOrigin(requestOriginHeader);
    if (fromOrigin)
        return fromOrigin;
    const fromReferer = tryNormalizeOrigin(requestRefererHeader);
    if (fromReferer)
        return fromReferer;
    // Env fallback (production should set APP_BASE_URL).
    return APP_BASE_URL;
}
/**
 * Stripe lazy init (Firebase Secrets)
 */
let stripeInstance = null;
function getStripe() {
    if (stripeInstance)
        return stripeInstance;
    // Prefer STRIPE_SECRET (set via Functions Secret Manager). Allow fallback to STRIPE_SECRET_KEY.
    const secret = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY;
    if (!secret) {
        throw new Error("Missing Stripe secret (STRIPE_SECRET or STRIPE_SECRET_KEY)");
    }
    stripeInstance = new stripe_1.default(secret, {
        apiVersion: "2023-10-16",
    });
    return stripeInstance;
}
/**
 * ===============================
 * CREATE STRIPE CHECKOUT SESSION
 * ===============================
 */
exports.createCheckoutSession = functions
    .runWith({ secrets: ["STRIPE_SECRET", "APP_BASE_URL"] })
    .https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Authentication required");
        }
        const { orderId, listingTitle, amountCents, appBaseUrl } = data;
        if (!orderId || !listingTitle || !amountCents) {
            throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
        }
        const stripe = getStripe();
        const baseUrl = resolveAppBaseUrl(appBaseUrl, context.rawRequest?.headers?.origin, context.rawRequest?.headers?.referer);
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
    }
    catch (err) {
        console.error("createCheckoutSession failed:", err);
        throw new functions.https.HttpsError("internal", err.message || "Stripe checkout failed");
    }
});
/**
 * ===============================
 * STRIPE WEBHOOK
 * ===============================
 */
exports.stripeWebhook = functions
    .runWith({
    secrets: ["STRIPE_SECRET", "STRIPE_WEBHOOK_SECRET"],
})
    .https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing Stripe signature");
        return;
    }
    try {
        const stripe = getStripe();
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
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
    }
    catch (err) {
        console.error("Webhook error:", err);
        res.status(400).send("Webhook failed");
    }
});
/**
 * ===============================
 * STRIPE CONNECT ONBOARDING
 * ===============================
 */
exports.onboardStripe = functions
    .runWith({ secrets: ["STRIPE_SECRET", "APP_BASE_URL"] })
    .https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Authentication required");
        }
        const baseUrl = resolveAppBaseUrl(data?.appBaseUrl, context.rawRequest?.headers?.origin, context.rawRequest?.headers?.referer);
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
    }
    catch (err) {
        console.error("onboardStripe failed:", err);
        throw new functions.https.HttpsError("internal", err.message || "Stripe onboarding failed");
    }
});
/**
 * ===============================
 * SELLER PAYOUTS
 * ===============================
 */
exports.getStripePayouts = functions
    .runWith({ secrets: ["STRIPE_SECRET"] })
    .https.onCall(async (_data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Authentication required");
        }
        const uid = context.auth.uid;
        const userSnap = await db.collection("users").doc(uid).get();
        const userData = userSnap.data();
        const accountId = userData?.stripeAccountId;
        if (!accountId) {
            throw new functions.https.HttpsError("failed-precondition", "No Stripe account connected");
        }
        const stripe = getStripe();
        const payouts = await stripe.payouts.list({ limit: 10 }, { stripeAccount: accountId });
        const balance = await stripe.balance.retrieve({}, { stripeAccount: accountId });
        return { payouts: payouts.data, balance };
    }
    catch (err) {
        console.error("getStripePayouts failed:", err);
        throw new functions.https.HttpsError("internal", err.message || "Failed to fetch payouts");
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
exports.awardIsoTrophy = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    // Keep consistent with rules that require verified email for active access.
    if (context.auth.token.email_verified !== true) {
        throw new functions.https.HttpsError("failed-precondition", "Email verification required");
    }
    const isoId = typeof data?.isoId === "string" ? data.isoId.trim() : "";
    const commentId = typeof data?.commentId === "string" ? data.commentId.trim() : "";
    if (!isoId || !commentId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing isoId or commentId");
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
            throw new functions.https.HttpsError("permission-denied", "Only the ISO owner can award a trophy");
        }
        if (iso.status !== "OPEN") {
            throw new functions.https.HttpsError("failed-precondition", "ISO is not open");
        }
        if (iso.trophyAwardedAt) {
            throw new functions.https.HttpsError("already-exists", "Trophy already awarded for this ISO");
        }
        const commentSnap = await tx.get(commentRef);
        if (!commentSnap.exists) {
            throw new functions.https.HttpsError("not-found", "Fulfillment link not found");
        }
        const comment = commentSnap.data() || {};
        if (comment.type !== "FULFILLMENT") {
            throw new functions.https.HttpsError("failed-precondition", "Selected comment is not a fulfillment");
        }
        const sellerUid = comment.authorUid;
        const listingUrl = comment.listingUrl;
        if (typeof sellerUid !== "string" || sellerUid.trim() === "") {
            throw new functions.https.HttpsError("failed-precondition", "Fulfillment is missing sellerUid");
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
});
