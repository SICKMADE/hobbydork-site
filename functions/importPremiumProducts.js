// Node.js script to import premium products into Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Update with your service account file
const products = require('../firestore.seed-premiumProducts.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importProducts() {
  for (const product of products) {
    await db.collection('premiumProducts').doc(product.id).set(product);
    console.log(`Imported: ${product.name}`);
  }
  console.log('All products imported!');
  process.exit(0);
}

importProducts().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
