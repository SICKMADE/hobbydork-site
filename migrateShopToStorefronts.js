// Migrate all documents from /shop to /storefronts in Firestore
// Usage: node migrateShopToStorefronts.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function migrateShopToStorefronts() {
  const shopSnap = await db.collection('shop').get();
  for (const doc of shopSnap.docs) {
    const data = doc.data();
    // Copy to /storefronts/{id}
    await db.collection('storefronts').doc(doc.id).set(data);
    console.log(`Migrated shop/${doc.id} to storefronts/${doc.id}`);
  }
  console.log('Migration complete.');
}

migrateShopToStorefronts().catch(console.error);
