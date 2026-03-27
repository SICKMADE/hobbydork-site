import admin from 'firebase-admin';

// Initialize admin SDK once.
if (!admin.apps.length) {
  try {
    // If a service account JSON is provided via env, use it. Otherwise fallback to default credentials.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const svc = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({ credential: admin.credential.cert(svc), storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "studio-4668517724-751eb.firebasestorage.app" });
    } else {
      admin.initializeApp({ storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "studio-4668517724-751eb.firebasestorage.app" });
    }
  } catch (e) {
    // If initialization fails, rethrow so server errors are visible.
    console.error('Failed to initialize Firebase Admin SDK', e);
    throw e;
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
