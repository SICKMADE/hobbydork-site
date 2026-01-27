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
exports.stripeWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const db = admin.firestore();
const STRIPE_SECRET = (0, params_1.defineSecret)("STRIPE_SECRET");
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)("STRIPE_WEBHOOK_SECRET");
let stripe;
exports.stripeWebhook = (0, https_1.onRequest)({ secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
    const stripeSecret = process.env.STRIPE_SECRET;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret) {
        console.error("Stripe secret not set in environment variables or Firebase config");
        res.status(500).send("Stripe secret not set in environment variables or Firebase config");
        return;
    }
    if (!webhookSecret) {
        console.error("Stripe webhook secret not set in environment variables or Firebase config");
        res.status(500).send("Stripe webhook secret not set in environment variables or Firebase config");
        return;
    }
    if (!stripe) {
        stripe = new stripe_1.default(stripeSecret, {
            apiVersion: "2023-10-16",
        });
    }
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    }
    catch (err) {
        console.error("Webhook signature verification failed.", err);
        res.status(400).send(`Webhook Error: ${err}`);
        return;
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        // Spotlight purchase automation
        const spotlightStoreId = session.metadata?.spotlightStoreId;
        if (spotlightStoreId) {
            // Get the store doc
            const storeSnap = await db.collection("stores").where("storeId", "==", spotlightStoreId).limit(1).get();
            if (storeSnap.empty) {
                console.error("Store not found for spotlight", spotlightStoreId);
                res.status(404).send("Store not found");
                return;
            }
            const storeDoc = storeSnap.docs[0];
            const storeData = storeDoc.data();
            const ownerUid = storeData.ownerUid;
            // Calculate spotlight period (7 days from now)
            const now = admin.firestore.Timestamp.now();
            const endAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            // Create spotlight slot
            const slotRef = db.collection("spotlightSlots").doc();
            await slotRef.set({
                slotId: slotRef.id,
                storeId: spotlightStoreId,
                ownerUid,
                startAt: now,
                endAt,
                active: true,
                createdAt: now,
            });
            // Update store doc
            await storeDoc.ref.update({
                isSpotlighted: true,
                spotlightUntil: endAt,
                updatedAt: now,
            });
            // Notify store owner
            await db.collection("users").doc(ownerUid).collection("notifications").add({
                type: "SPOTLIGHT",
                title: "Your store is in the spotlight!",
                body: `Congratulations! Your store is now featured in the Store Spotlight for 7 days.`,
                relatedId: spotlightStoreId,
                read: false,
                createdAt: now,
            });
            res.status(200).send("Spotlight slot created");
            return;
        }
        // Auction fee payment
        const auctionId = session.metadata?.auctionId;
        const sellerUid = session.metadata?.sellerUid;
        if (auctionId && sellerUid) {
            await db.collection("users").doc(sellerUid).collection("notifications").add({
                type: "AUCTION",
                title: "Auction is now live!",
                body: `Your auction is now open to bidders.`,
                relatedId: auctionId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            res.status(200).send("Auction payment processed");
            return;
        }
        // Order payment (existing logic)
        const orderId = session.metadata?.orderId;
        const buyerUid = session.metadata?.buyerUid;
        if (orderId && buyerUid) {
            // Mark order as paid in Firestore
            await db.collection("orders").doc(orderId).update({
                status: "PAID",
                state: "PAID",
                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                paymentIntentId: session.payment_intent,
            });
            // Optionally notify buyer/seller here
            res.status(200).send("Order payment processed");
            return;
        }
    }
    res.status(200).send("Received");
});
