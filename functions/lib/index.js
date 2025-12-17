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
/**
 * 🔑 CHANGE THIS ONCE
 * MUST be a real HTTPS URL you control
 */
const APP_BASE_URL = "http://localhost:3000"; // change later to prod domain
/**
 * Stripe lazy init (Firebase Secrets)
 */
let stripeInstance = null;
function getStripe() {
    if (stripeInstance)
        return stripeInstance;
    const secret = process.env.STRIPE_SECRET;
    if (!secret) {
        throw new Error("Missing STRIPE_SECRET");
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
    .runWith({ secrets: ["STRIPE_SECRET"] })
    .https.onCall(async (data, context) => {
    try {
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
                        product_data: { name: listingTitle },
                    },
                    quantity: 1,
                },
            ],
            metadata: { orderId },
            success_url: `${APP_BASE_URL}/orders/success?orderId=${orderId}`,
            cancel_url: `${APP_BASE_URL}/orders/cancelled?orderId=${orderId}`,
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
    .runWith({ secrets: ["STRIPE_SECRET"] })
    .https.onCall(async (_data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Authentication required");
        }
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
            refresh_url: `${APP_BASE_URL}/store/dashboard`,
            return_url: `${APP_BASE_URL}/store/dashboard`,
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
