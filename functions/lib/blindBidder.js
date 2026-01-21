"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitBlindBid = exports.createBlindBidAuction = exports.processEndedBlindBidAuctions = exports.adminRerunBlindBidAuction = exports.setBlindBidAuctionImage = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebaseAdmin_1 = require("./firebaseAdmin");
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
const stripeSecret = (0, params_1.defineSecret)("STRIPE_SECRET");
// Update auction imageUrl after creation
exports.setBlindBidAuctionImage = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    const auctionId = request.data.auctionId;
    const imageUrl = request.data.imageUrl;
    if (!auctionId || !imageUrl) {
        throw new https_1.HttpsError("invalid-argument", "Missing auctionId or imageUrl");
    }
    const auctionRef = firebaseAdmin_1.db.collection("blindBidAuctions").doc(auctionId);
    const auctionSnap = await auctionRef.get();
    if (!auctionSnap.exists)
        throw new https_1.HttpsError("not-found", "Auction not found");
    const auction = auctionSnap.data();
    if (!auction || auction.sellerUid !== uid) {
        throw new https_1.HttpsError("permission-denied", "Only the seller can update the image");
    }
    await auctionRef.update({ imageUrl });
    return { success: true };
});
// Admin callable function to rerun an auction
exports.adminRerunBlindBidAuction = (0, https_1.onCall)(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    }
    // Only admins can rerun auctions
    const userSnap = await firebaseAdmin_1.db.collection("users").doc(uid).get();
    const user = userSnap.data();
    if (!user?.isAdmin) {
        throw new https_1.HttpsError("permission-denied", "Admin only");
    }
    const auctionId = request.data.auctionId;
    const newEndsAt = request.data.newEndsAt;
    const clearBids = request.data.clearBids;
    if (!auctionId || !newEndsAt) {
        throw new https_1.HttpsError("invalid-argument", "Missing auctionId or newEndsAt");
    }
    const auctionRef = firebaseAdmin_1.db.collection("blindBidAuctions").doc(auctionId);
    const auctionSnap = await auctionRef.get();
    if (!auctionSnap.exists)
        throw new https_1.HttpsError("not-found", "Auction not found");
    // Reset status and endsAt, preserve flatFeePaid
    await auctionRef.update({
        status: "OPEN",
        endsAt: firebaseAdmin_1.admin.firestore.Timestamp.fromMillis(newEndsAt),
        winnerBidId: null,
        winnerUid: null,
        closedAt: null
    });
    // Optionally clear previous bids
    if (clearBids) {
        const bidsSnap = await auctionRef.collection("bids").get();
        for (const bidDoc of bidsSnap.docs) {
            await bidDoc.ref.delete();
        }
    }
    return { success: true };
});
// Scheduled function to process ended blind bidder auctions
exports.processEndedBlindBidAuctions = (0, scheduler_1.onSchedule)("every 5 minutes", async (event) => {
    // ...existing code...
    // No changes needed for context/auth or HttpsError in scheduled function
});
// Flat fee for listing
const BLIND_BIDDER_LISTING_FEE_CENTS = 499;
exports.createBlindBidAuction = (0, https_1.onCall)({ secrets: [stripeSecret] }, async (request) => {
    if (!stripeSecret.value()) {
        throw new https_1.HttpsError("internal", "Stripe secret not set in environment");
    }
    const stripe = new stripe_1.default(stripeSecret.value(), { apiVersion: "2023-10-16" });
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    // Only sellers can create auctions
    const userSnap = await firebaseAdmin_1.db.collection("users").doc(uid).get();
    const user = userSnap.data();
    if (!user?.isSeller || user.status !== "ACTIVE") {
        throw new https_1.HttpsError("permission-denied", "Only active sellers can create blind auctions");
    }
    const title = request.data.title;
    const description = request.data.description;
    const imageUrl = request.data.imageUrl;
    if (!title || !description) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields");
    }
    // Charge flat fee via Stripe
    const paymentIntent = await stripe.paymentIntents.create({
        amount: BLIND_BIDDER_LISTING_FEE_CENTS,
        currency: "usd",
        payment_method_types: ["card"],
        metadata: { type: "blind_bidder_listing", sellerUid: uid },
    });
    // Create auction doc with status OPEN, endsAt 24hr from now
    const now = firebaseAdmin_1.admin.firestore.Timestamp.now();
    const endsAt = firebaseAdmin_1.admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
    const auctionRef = await firebaseAdmin_1.db.collection("blindBidAuctions").add({
        sellerUid: uid,
        title,
        description,
        imageUrl: imageUrl || null,
        createdAt: now,
        endsAt,
        status: "OPEN",
        flatFeePaid: false,
        stripePaymentIntentId: paymentIntent.id,
    });
    return { auctionId: auctionRef.id, paymentIntentClientSecret: paymentIntent.client_secret };
});
exports.submitBlindBid = (0, https_1.onCall)({ secrets: [stripeSecret] }, async (request) => {
    if (!stripeSecret.value()) {
        throw new https_1.HttpsError("internal", "Stripe secret not set in environment");
    }
    const stripe = new stripe_1.default(stripeSecret.value(), { apiVersion: "2023-10-16" });
    const uid = request.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError("unauthenticated", "Auth required");
    if (!request.auth || request.auth.token.email_verified !== true) {
        throw new https_1.HttpsError("failed-precondition", "Email verification required");
    }
    const auctionId = request.data.auctionId;
    const amount = request.data.amount;
    if (!auctionId || !amount || typeof amount !== "number" || amount <= 0) {
        throw new https_1.HttpsError("invalid-argument", "Missing or invalid bid data");
    }
    // Fetch auction
    const auctionRef = firebaseAdmin_1.db.collection("blindBidAuctions").doc(auctionId);
    const auctionSnap = await auctionRef.get();
    if (!auctionSnap.exists)
        throw new https_1.HttpsError("not-found", "Auction not found");
    const auction = auctionSnap.data();
    if (!auction || auction.status !== "OPEN") {
        throw new https_1.HttpsError("failed-precondition", "Auction is not open for bids");
    }
    // Authorize payment via Stripe (not capture)
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        payment_method_types: ["card"],
        capture_method: "manual",
        metadata: { type: "blind_bidder_bid", auctionId, bidderUid: uid },
    });
    // Store bid in subcollection
    const bidRef = auctionRef.collection("bids").doc();
    await bidRef.set({
        bidderUid: uid,
        amount,
        createdAt: firebaseAdmin_1.admin.firestore.Timestamp.now(),
        stripePaymentIntentId: paymentIntent.id,
        status: "AUTHORIZED"
    });
    return { bidId: bidRef.id, paymentIntentClientSecret: paymentIntent.client_secret };
});
