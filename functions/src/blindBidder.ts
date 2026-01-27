import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db, admin } from "./firebaseAdmin";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";
const stripeSecret = defineSecret("STRIPE_SECRET");

// Update auction imageUrl after creation
export const setBlindBidAuctionImage = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Auth required");
  const auctionId = request.data.auctionId;
  const imageUrl = request.data.imageUrl;
  if (!auctionId || !imageUrl) {
    throw new HttpsError("invalid-argument", "Missing auctionId or imageUrl");
  }
  const auctionRef = db.collection("blindBidAuctions").doc(auctionId);
  const auctionSnap = await auctionRef.get();
  if (!auctionSnap.exists) throw new HttpsError("not-found", "Auction not found");
  const auction = auctionSnap.data();
  if (!auction || auction.sellerUid !== uid) {
    throw new HttpsError("permission-denied", "Only the seller can update the image");
  }
  await auctionRef.update({ imageUrl });
  return { success: true };
});


// Admin callable function to rerun an auction
export const adminRerunBlindBidAuction = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Auth required");
  }
  // Only admins can rerun auctions
  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data();
  if (!user?.isAdmin) {
    throw new HttpsError("permission-denied", "Admin only");
  }
  const auctionId = request.data.auctionId;
  const newEndsAt = request.data.newEndsAt;
  const clearBids = request.data.clearBids;
  if (!auctionId || !newEndsAt) {
    throw new HttpsError("invalid-argument", "Missing auctionId or newEndsAt");
  }
  const auctionRef = db.collection("blindBidAuctions").doc(auctionId);
  const auctionSnap = await auctionRef.get();
  if (!auctionSnap.exists) throw new HttpsError("not-found", "Auction not found");
  // Reset status and endsAt, preserve flatFeePaid
  await auctionRef.update({
    status: "OPEN",
    endsAt: admin.firestore.Timestamp.fromMillis(newEndsAt),
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
export const processEndedBlindBidAuctions = onSchedule("every 5 minutes", async (event) => {
  // ...existing code...
  // No changes needed for context/auth or HttpsError in scheduled function
});



// Tier-based auction fee logic (example values, update as needed)
function getAuctionFeeCentsForTier(tier: string): number {
  switch (tier) {
    case 'GOLD':
      return 299; // $2.99
    case 'SILVER':
      return 499; // $4.99
    default:
      return 99999; // prohibitively high for Bronze (should be blocked)
  }
}

export const createBlindBidAuction = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!stripeSecret.value()) {
    throw new HttpsError("internal", "Stripe secret not set in environment");
  }
  const stripe = new Stripe(stripeSecret.value(), { apiVersion: "2023-10-16" });
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Auth required");
  if (!request.auth || request.auth.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Email verification required");
  }
  // Only Silver/Gold sellers can create auctions
  const userSnap = await db.collection("users").doc(uid).get();
  const user = userSnap.data();
  if (!user?.isSeller || user.status !== "ACTIVE") {
    throw new HttpsError("permission-denied", "Only active sellers can create blind auctions");
  }
  if (user.sellerTier !== 'SILVER' && user.sellerTier !== 'GOLD') {
    throw new HttpsError("permission-denied", "Only Silver and Gold sellers can create auctions");
  }
  const title = request.data.title;
  const description = request.data.description;
  const imageUrl = request.data.imageUrl;
  if (!title || !description) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }
  // Calculate tier-based fee
  const auctionFeeCents = getAuctionFeeCentsForTier(user.sellerTier);
  // Charge fee via Stripe
  const paymentIntent = await stripe.paymentIntents.create({
    amount: auctionFeeCents,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: { type: "blind_bidder_listing", sellerUid: uid, sellerTier: user.sellerTier },
  });
  // Create auction doc with status OPEN, endsAt 24hr from now
  const now = admin.firestore.Timestamp.now();
  const endsAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
  const auctionRef = await db.collection("blindBidAuctions").add({
    sellerUid: uid,
    title,
    description,
    imageUrl: imageUrl || null,
    createdAt: now,
    endsAt,
    status: "OPEN",
    flatFeePaid: false,
    stripePaymentIntentId: paymentIntent.id,
    sellerTier: user.sellerTier,
    auctionFeeCents,
  });
  return { auctionId: auctionRef.id, paymentIntentClientSecret: paymentIntent.client_secret };
});

export const submitBlindBid = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!stripeSecret.value()) {
    throw new HttpsError("internal", "Stripe secret not set in environment");
  }
  const stripe = new Stripe(stripeSecret.value(), { apiVersion: "2023-10-16" });
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Auth required");
  if (!request.auth || request.auth.token.email_verified !== true) {
    throw new HttpsError("failed-precondition", "Email verification required");
  }
  const auctionId = request.data.auctionId;
  const amount = request.data.amount;
  if (!auctionId || !amount || typeof amount !== "number" || amount <= 0) {
    throw new HttpsError("invalid-argument", "Missing or invalid bid data");
  }
  // Fetch auction
  const auctionRef = db.collection("blindBidAuctions").doc(auctionId);
  const auctionSnap = await auctionRef.get();
  if (!auctionSnap.exists) throw new HttpsError("not-found", "Auction not found");
  const auction = auctionSnap.data();
  if (!auction || auction.status !== "OPEN") {
    throw new HttpsError("failed-precondition", "Auction is not open for bids");
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
    createdAt: admin.firestore.Timestamp.now(),
    stripePaymentIntentId: paymentIntent.id,
    status: "AUTHORIZED"
  });
  return { bidId: bidRef.id, paymentIntentClientSecret: paymentIntent.client_secret };
});
