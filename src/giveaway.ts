import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
