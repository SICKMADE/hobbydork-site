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
exports.getStripePayouts = exports.onboardStripe = exports.stripeWebhook = exports.createCheckoutSession = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
admin.initializeApp();
const db = admin.firestore();
// Lazy Stripe init (read from environment variables at runtime).
// Avoid initializing Stripe at module load time so Firebase can analyze
// the code during deploy without requiring env vars to be present.
let stripeInstance = null;
function getStripe() {
    if (stripeInstance)
        return stripeInstance;
    const secret = process.env.STRIPE_SECRET;
    if (!secret) {
        throw new Error("Missing STRIPE_SECRET environment variable");
    }
    stripeInstance = new stripe_1.default(secret, { apiVersion: "2023-10-16" });
    return stripeInstance;
}
/**
 * Create Stripe Checkout Session
 * Called from frontend cart
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const { orderId, listingTitle, amountCents } = data;
    if (!orderId || !listingTitle || !amountCents) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields");
    }
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    unit_amount: amountCents,
                    product_data: {
                        name: listingTitle,
                    },
                },
                quantity: 1,
            },
        ],
        metadata: {
            orderId,
        },
        success_url: "https://example.com/orders/success",
        cancel_url: "https://example.com/orders/cancelled",
    });
    await db.collection("orders").doc(orderId).update({
        stripeSessionId: session.id,
        state: "PENDING_PAYMENT",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { url: session.url };
});
/**
 * Stripe Webhook
 * THE ONLY PLACE orders become PAID
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).send("Missing Stripe signature");
        return;
    }
    let event;
    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
        }
        // `req.rawBody` may not be typed — fall back to `req.body` if needed.
        const rawBody = req.rawBody ?? req.body;
        const stripe = getStripe();
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Webhook verification failed:", errMsg);
        res.status(400).send(`Webhook Error: ${errMsg}`);
        return;
    }
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
});
/**
 * Stripe Connect Onboarding
 * Creates account link for seller onboarding
 */
exports.onboardStripe = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;
    // Get user data to check if account exists
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const stripe = getStripe();
    let accountId = userData?.stripeAccountId;
    if (!accountId) {
        // Create new Stripe Connect account
        const account = await stripe.accounts.create({
            type: "express",
            country: "US", // Adjust as needed
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        accountId = account.id;
        // Save to Firestore
        await db.collection("users").doc(uid).update({
            stripeAccountId: accountId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    // Create account link
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: "https://example.com/store/dashboard", // Update with your domain
        return_url: "https://example.com/store/dashboard", // Update with your domain
        type: "account_onboarding",
    });
    return { url: accountLink.url };
});
/**
 * Get Stripe Payouts
 * Lists payouts for the connected account
 */
exports.getStripePayouts = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required");
    }
    const uid = context.auth.uid;
    // Get user data
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const accountId = userData?.stripeAccountId;
    if (!accountId) {
        throw new functions.https.HttpsError("failed-precondition", "No Stripe account connected");
    }
    const stripe = getStripe();
    const payouts = await stripe.payouts.list({ destination: accountId }, { stripeAccount: accountId });
    // Get balance
    const balance = await stripe.balance.retrieve({}, { stripeAccount: accountId });
    return { payouts: payouts.data, balance };
});
