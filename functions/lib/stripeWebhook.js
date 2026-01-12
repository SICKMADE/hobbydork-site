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
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const db = admin.firestore();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET, {
    apiVersion: "2023-10-16",
});
// Stripe webhook handler for checkout.session.completed
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    }
    catch (err) {
        console.error("Webhook signature verification failed.", err);
        res.status(400).send(`Webhook Error: ${err}`);
        return;
    }
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        const buyerUid = session.metadata?.buyerUid;
        if (!orderId || !buyerUid) {
            console.error("Missing orderId or buyerUid in session metadata");
            res.status(400).send("Missing orderId or buyerUid");
            return;
        }
        // Fetch order from Firestore
        const orderRef = db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            console.error("Order not found", orderId);
            res.status(404).send("Order not found");
            return;
        }
        const order = orderSnap.data();
        const sellerUid = order?.sellerUid;
        // Update order status
        await orderRef.update({
            status: "PAID",
            paymentIntentId: session.payment_intent,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Send notification to buyer
        await db.collection("users").doc(buyerUid).collection("notifications").add({
            type: "ORDER",
            title: "Thank you for your purchase!",
            body: order?.listingTitle
                ? `Your payment for "${order.listingTitle}" was successful. Your order #${orderId} is now being processed.`
                : `Your payment was successful. Your order #${orderId} is now being processed.`,
            relatedId: orderId,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Send notification to seller
        if (sellerUid) {
            await db.collection("users").doc(sellerUid).collection("notifications").add({
                type: "ORDER",
                title: "New sale!",
                body: order?.listingTitle
                    ? `You sold "${order.listingTitle}" (Order #${orderId}). Please fulfill this order promptly.`
                    : `You have received a new order (#${orderId}). Please fulfill this order promptly.`,
                relatedId: orderId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    res.status(200).send("Received");
});
