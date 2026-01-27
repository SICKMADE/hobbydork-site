"use strict";
// Main marketplace auction logic (Firestore triggers, callable functions, etc.)
// This file handles auction creation, bidding, and closing for the main marketplace only.
// DO NOT reference or touch blind bidder logic here.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeAuction = exports.placeBid = exports.createAuction = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Auction creation (restricted by seller tier, fee enforcement, etc.)
exports.createAuction = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const sellerUid = context.auth.uid;
    // Fetch seller profile and check tier
    const sellerDoc = await db.collection('users').doc(sellerUid).get();
    const seller = sellerDoc.data();
    if (!seller || (seller.tier !== 'SILVER' && seller.tier !== 'GOLD')) {
        throw new functions.https.HttpsError('permission-denied', 'Only Silver and Gold sellers can create auctions');
    }
    // Enforce auction length, high-confidence item rules (TODO: implement as per spec)
    // --- FEE LOGIC START ---
    // --- FEE LOGIC: Upfront only, per locked spec ---
    let upfrontFee = 0;
    if (seller.tier === 'SILVER') {
        // 5% upfront fee, min $10
        const baseAmount = typeof data.startingPrice === 'number' ? data.startingPrice : 0;
        upfrontFee = Math.max(Math.round(baseAmount * 0.05 * 100) / 100, 10);
    }
    else if (seller.tier === 'GOLD') {
        // 2% upfront fee, min $5
        const baseAmount = typeof data.startingPrice === 'number' ? data.startingPrice : 0;
        upfrontFee = Math.max(Math.round(baseAmount * 0.02 * 100) / 100, 5);
    }
    // Record fee transaction (simulate payment processor)
    await db.collection('users').doc(sellerUid).collection('feeTransactions').add({
        type: 'auction-upfront',
        amount: upfrontFee,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        auctionTitle: data.title || '',
        sellerTier: seller.tier,
    });
    // --- FEE LOGIC END ---
    // Create auction in 'auctions' collection
    const auctionData = {
        ...data,
        sellerUid,
        status: 'OPEN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        upfrontFee,
        afterSaleFee: 0,
        bids: [],
    };
    const auctionRef = await db.collection('auctions').add(auctionData);
    return { success: true, auctionId: auctionRef.id };
});
// Place bid on auction
exports.placeBid = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    const userUid = context.auth.uid;
    const { auctionId, amount } = data;
    if (!auctionId || typeof amount !== 'number')
        throw new functions.https.HttpsError('invalid-argument', 'Missing auctionId or amount');
    const auctionRef = db.collection('auctions').doc(auctionId);
    const auctionSnap = await auctionRef.get();
    if (!auctionSnap.exists)
        throw new functions.https.HttpsError('not-found', 'Auction not found');
    const auction = auctionSnap.data();
    if (!auction || auction.status !== 'OPEN')
        throw new functions.https.HttpsError('failed-precondition', 'Auction is not open');
    // TODO: Enforce bid increment, anti-sniping, and other rules
    // Add bid to bids subcollection
    await auctionRef.collection('bids').add({
        bidderUid: userUid,
        amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
});
// Close auction (scheduled or triggered)
exports.closeAuction = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    // Find auctions that should be closed
    const now = admin.firestore.Timestamp.now();
    const auctionsSnap = await db.collection('auctions').where('status', '==', 'OPEN').where('endsAt', '<=', now).get();
    for (const doc of auctionsSnap.docs) {
        const auctionRef = doc.ref;
        const auction = doc.data();
        // Find highest bid
        const bidsSnap = await auctionRef.collection('bids').orderBy('amount', 'desc').limit(1).get();
        let winnerUid = null;
        let winningBid = null;
        if (!bidsSnap.empty) {
            const topBid = bidsSnap.docs[0].data();
            winnerUid = topBid.bidderUid;
            winningBid = topBid.amount;
        }
        await auctionRef.update({
            status: 'CLOSED',
            winnerUid,
            winningBid,
            closedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // TODO: Notify winner and seller, process payment, etc.
    }
    return null;
});
// Additional logic for fee processing, notifications, etc. can be added here.
