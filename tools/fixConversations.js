// Firebase Admin SDK script to ensure all conversations have correct participantUids array
// Usage: node fixConversations.js (after setting up Firebase Admin credentials)

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function fixConversations() {
  const conversationsRef = db.collection('conversations');
  const snapshot = await conversationsRef.get();
  let fixed = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    // If participantUids is missing or not an array, skip
    if (!Array.isArray(data.participantUids)) continue;
    // Remove duplicates and nulls
    const uniqueUids = Array.from(new Set(data.participantUids.filter(Boolean)));
    // Optionally, add participants from 'participants' array if present
    if (Array.isArray(data.participants)) {
      for (const uid of data.participants) {
        if (uid && !uniqueUids.includes(uid)) uniqueUids.push(uid);
      }
    }
    // If changed, update the doc
    if (
      uniqueUids.length !== data.participantUids.length ||
      (data.participants && uniqueUids.length !== data.participants.length)
    ) {
      await docSnap.ref.update({ participantUids: uniqueUids, participants: uniqueUids });
      fixed++;
      console.log(`Fixed conversation ${docSnap.id}`);
    }
  }
  console.log(`Done. Fixed ${fixed} conversations.`);
}

fixConversations().catch(console.error);
