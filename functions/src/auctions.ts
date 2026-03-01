// Main marketplace auction logic (Firestore triggers, callable functions, etc.)
// This file handles auction creation, bidding, and closing for the main marketplace only.
// DO NOT reference or touch blind bidder logic here.

import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

const MIN_AUCTION_HOURS = 24;
const MAX_AUCTION_DAYS = 14;
const DEFAULT_BID_INCREMENT = 1;
const ANTI_SNIPING_WINDOW_MS = 2 * 60 * 1000;
const ANTI_SNIPING_EXTENSION_MS = 5 * 60 * 1000;

function toMillis(value: any): number | null {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeTimestamp(value: any): admin.firestore.Timestamp {
  if (value?.seconds != null && value?.nanoseconds != null) {
    return new admin.firestore.Timestamp(value.seconds, value.nanoseconds);
  }
  if (typeof value?.toDate === 'function') {
    return admin.firestore.Timestamp.fromDate(value.toDate());
  }
  if (value instanceof Date) {
    return admin.firestore.Timestamp.fromDate(value);
  }
  const parsed = Date.parse(String(value));
  if (!Number.isNaN(parsed)) {
    return admin.firestore.Timestamp.fromMillis(parsed);
  }
  throw new functions.https.HttpsError('invalid-argument', 'Invalid auction timestamp');
}


// Auction creation (restricted by seller tier, fee enforcement, etc.)
export const createAuction = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  const sellerUid = context.auth.uid;
  // Fetch seller profile and check tier
  const sellerDoc = await db.collection('users').doc(sellerUid).get();
  const seller = sellerDoc.data();
  if (!seller || (seller.tier !== 'SILVER' && seller.tier !== 'GOLD')) {
    throw new functions.https.HttpsError('permission-denied', 'Only Silver and Gold sellers can create auctions');
  }

  const startingPrice = Number(data?.startingPrice);
  if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'startingPrice must be a positive number');
  }

  const startsAt = data?.startsAt ? normalizeTimestamp(data.startsAt) : admin.firestore.Timestamp.now();
  const endsAt = normalizeTimestamp(data?.endsAt);
  const durationMs = endsAt.toMillis() - startsAt.toMillis();
  const minDurationMs = MIN_AUCTION_HOURS * 60 * 60 * 1000;
  const maxDurationMs = MAX_AUCTION_DAYS * 24 * 60 * 60 * 1000;

  if (durationMs < minDurationMs || durationMs > maxDurationMs) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Auction duration must be between ${MIN_AUCTION_HOURS} hours and ${MAX_AUCTION_DAYS} days`
    );
  }

  if (data?.requiresHighConfidence === true && seller.tier !== 'GOLD') {
    throw new functions.https.HttpsError('permission-denied', 'High-confidence auctions require GOLD tier');
  }

  // --- FEE LOGIC START ---
  // --- FEE LOGIC: Upfront only, per locked spec ---
  let upfrontFee = 0;
  if (seller.tier === 'SILVER') {
    // 5% upfront fee, min $10
    const baseAmount = startingPrice;
    upfrontFee = Math.max(Math.round(baseAmount * 0.05 * 100) / 100, 10);
  } else if (seller.tier === 'GOLD') {
    // 2% upfront fee, min $5
    const baseAmount = startingPrice;
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
    startingPrice,
    currentBid: startingPrice,
    bidIncrement: Number(data?.bidIncrement) > 0 ? Number(data.bidIncrement) : DEFAULT_BID_INCREMENT,
    startsAt,
    endsAt,
    sellerUid,
    status: 'OPEN',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    upfrontFee,
    afterSaleFee: 0,
    bids: [],
    bidCount: 0,
    highestBidderUid: null,
  };
  const auctionRef = await db.collection('auctions').add(auctionData);
  return { success: true, auctionId: auctionRef.id };
});

// Place bid on auction
export const placeBid = functions.https.onCall(async (data: any, context: any) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  const userUid = context.auth.uid;
  const { auctionId, amount } = data;
  if (!auctionId || typeof amount !== 'number') throw new functions.https.HttpsError('invalid-argument', 'Missing auctionId or amount');
  const auctionRef = db.collection('auctions').doc(auctionId);
  await db.runTransaction(async (tx) => {
    const auctionSnap = await tx.get(auctionRef);
    if (!auctionSnap.exists) throw new functions.https.HttpsError('not-found', 'Auction not found');

    const auction = auctionSnap.data();
    if (!auction || auction.status !== 'OPEN') {
      throw new functions.https.HttpsError('failed-precondition', 'Auction is not open');
    }

    if (auction.sellerUid === userUid) {
      throw new functions.https.HttpsError('failed-precondition', 'Seller cannot bid on own auction');
    }

    const nowMs = Date.now();
    const startsAtMs = toMillis(auction.startsAt);
    const endsAtMs = toMillis(auction.endsAt);
    if (startsAtMs && nowMs < startsAtMs) {
      throw new functions.https.HttpsError('failed-precondition', 'Auction has not started');
    }
    if (!endsAtMs || nowMs >= endsAtMs) {
      throw new functions.https.HttpsError('failed-precondition', 'Auction has ended');
    }

    const bidIncrement = Number(auction.bidIncrement) > 0 ? Number(auction.bidIncrement) : DEFAULT_BID_INCREMENT;
    const currentBid = Number(auction.currentBid ?? auction.startingPrice ?? 0);
    const minimumAllowed = Math.round((currentBid + bidIncrement) * 100) / 100;
    if (!Number.isFinite(amount) || amount < minimumAllowed) {
      throw new functions.https.HttpsError('invalid-argument', `Bid must be at least ${minimumAllowed}`);
    }

    const bidRef = auctionRef.collection('bids').doc();
    tx.set(bidRef, {
      bidderUid: userUid,
      amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const patch: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
      currentBid: amount,
      highestBidderUid: userUid,
      bidCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (endsAtMs - nowMs <= ANTI_SNIPING_WINDOW_MS) {
      patch.endsAt = admin.firestore.Timestamp.fromMillis(endsAtMs + ANTI_SNIPING_EXTENSION_MS);
    }

    tx.update(auctionRef, patch);
  });

  const auctionSnap = await auctionRef.get();
  const auction = auctionSnap.data();
  if (auction?.sellerUid) {
    await db.collection('users').doc(auction.sellerUid).collection('notifications').add({
      type: 'AUCTION_NEW_BID',
      auctionId,
      bidderUid: userUid,
      amount,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { success: true };
});

// Close auction (scheduled or triggered)
export const closeAuction = functions.pubsub.schedule('every 5 minutes').onRun(async (context: any) => {
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
      paymentStatus: winnerUid ? 'PENDING' : null,
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (winnerUid) {
      await db.collection('users').doc(winnerUid).collection('notifications').add({
        type: 'AUCTION_WON',
        auctionId: doc.id,
        amount: winningBid,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (auction?.sellerUid) {
      await db.collection('users').doc(String(auction.sellerUid)).collection('notifications').add({
        type: 'AUCTION_CLOSED',
        auctionId: doc.id,
        winnerUid,
        amount: winningBid,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  return null;
});

// Additional logic for fee processing, notifications, etc. can be added here.
