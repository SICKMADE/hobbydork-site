// Script to check if the current user's UID matches the ownerUid of their store
// Usage: Run with `node tools/checkStoreOwnerUid.js`

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function checkStoreOwnerUid(userUid, storeId) {
  const storeDoc = await db.collection('stores').doc(storeId).get();
  if (!storeDoc.exists) {
    console.log('Store not found:', storeId);
    return;
  }
  const storeData = storeDoc.data();
  if (storeData.ownerUid === userUid) {
    console.log('✅ ownerUid matches user.uid:', userUid);
  } else {
    console.log('❌ ownerUid does NOT match user.uid');
    console.log('  user.uid:', userUid);
    console.log('  store.ownerUid:', storeData.ownerUid);
  }
}

// Replace these with your actual values:
const userUid = 'PUT_YOUR_USER_UID_HERE';
const storeId = 'PUT_YOUR_STORE_ID_HERE';

checkStoreOwnerUid(userUid, storeId).then(() => process.exit());
