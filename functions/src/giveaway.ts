import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall, HttpsError } from "firebase-functions/v2/https";

// Callable function to manually draw a winner for a giveaway
export const drawGiveawayWinner = onCall(async (request) => {
  const { giveawayId } = request.data || {};
  
  if (!giveawayId) {
    throw new HttpsError("invalid-argument", "Missing giveawayId");
  }

  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const db = admin.firestore();
  const giveawayRef = db.collection('giveaways').doc(giveawayId);
  const giveawayDoc = await giveawayRef.get();
  
  if (!giveawayDoc.exists) {
    throw new HttpsError("not-found", "Giveaway not found");
  }

  const giveaway = giveawayDoc.data()!;

  // Verify the user is the seller/owner of the giveaway
  if (giveaway.seller !== request.auth.uid && giveaway.sellerName !== request.auth.token.name) {
    throw new HttpsError("permission-denied", "Only the giveaway creator can draw a winner");
  }

  // Check if already ended
  if (giveaway.status === 'ended' || giveaway.status === 'Ended') {
    throw new HttpsError("failed-precondition", "This giveaway has already ended");
  }

  // Get all entries
  const entriesRef = giveawayRef.collection('giveawayEntries');
  const entriesSnap = await entriesRef.get();

  if (entriesSnap.empty) {
    // No entries, just end the giveaway
    await giveawayRef.update({ 
      status: 'ended',
      endedAt: admin.firestore.Timestamp.now() 
    });
    return { success: true, message: "Giveaway ended with no entries", winner: null };
  }

  // Pick a random winner
  const entries = entriesSnap.docs;
  const winnerEntry = entries[Math.floor(Math.random() * entries.length)];
  const winnerData = winnerEntry.data();

  await giveawayRef.update({
    status: 'ended',
    endedAt: admin.firestore.Timestamp.now(),
    winnerUserId: winnerData.userId,
    winnerName: winnerData.userName || 'Anonymous'
  });

  return { 
    success: true, 
    message: "Winner drawn successfully!",
    winner: {
      userId: winnerData.userId,
      userName: winnerData.userName || 'Anonymous'
    }
  };
});

// Scheduled function to end giveaways and pick a winner
export const endExpiredGiveaways = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const giveawaysRef = db.collection('giveaways');
  const snapshot = await giveawaysRef.where('status', '==', 'active').where('endTime', '<=', now).get();

  for (const doc of snapshot.docs) {
    const giveaway = doc.data();
    const entriesRef = giveawaysRef.doc(doc.id).collection('giveawayEntries');
    const entriesSnap = await entriesRef.get();
    if (entriesSnap.empty) {
      // No entries, just end the giveaway
      await doc.ref.update({ status: 'ended', endedAt: now });
      continue;
    }
    // Pick a random winner
    const entries = entriesSnap.docs;
    const winnerEntry = entries[Math.floor(Math.random() * entries.length)];
    await doc.ref.update({
      status: 'ended',
      endedAt: now,
      winnerUserId: winnerEntry.data().userId,
    });
    // Optionally: notify winner and seller here
  }
  return null;
});

// Helper: When creating a giveaway, ensure endTime is stored as Firestore Timestamp
export const onCreateGiveaway = functions.firestore.document('giveaways/{giveawayId}').onCreate(async (snap, context) => {
  const data = snap.data();
  if (typeof data.endTime === 'string') {
    // Convert ISO string to Firestore Timestamp
    const ts = admin.firestore.Timestamp.fromDate(new Date(data.endTime));
    await snap.ref.update({ endTime: ts });
  }
});
