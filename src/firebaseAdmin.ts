import * as admin from "firebase-admin";
admin.initializeApp({
	storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "studio-4668517724-751eb.firebasestorage.app",
});
export const db = admin.firestore();
export { admin };