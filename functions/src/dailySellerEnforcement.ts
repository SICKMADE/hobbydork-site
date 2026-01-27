// Firebase Cloud Function: Daily Seller Tier & Late Shipment Enforcement
import * as functions from 'firebase-functions';
import * as functionsV1 from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
admin.initializeApp();

const db = admin.firestore();

// Helper: Update seller stats and tier
import { updateSellerTier } from './updateSellerTier';
// TODO: Ensure updateSellerTier exists at the correct path, e.g. './lib/updateSellerTier.ts'

export const dailySellerEnforcement = functionsV1.pubsub.schedule('every 24 hours').onRun(async (context: any) => {
  const now = Date.now();
  const ms48h = 48 * 60 * 60 * 1000;
  const ms72h = 72 * 60 * 60 * 1000;
  const ordersRef = db.collection('orders');
  const ordersSnap = await ordersRef.where('state', 'in', ['PAID', 'AWAITING_FULFILLMENT', 'SHIPPED']).get();
  const lateSellers = new Set<string>();

  for (const doc of ordersSnap.docs) {
    const order = doc.data();
    const created = order.createdAt?.toDate ? order.createdAt.toDate().getTime() : null;
    if (!created) continue;
    const age = now - created;
    // 1. Mark as late if >48h and no tracking
    if (age > ms48h && !order.trackingNumber) {
      await doc.ref.update({ late: true });
      lateSellers.add(order.sellerUid);
    }
    // 2. Mark as late if >72h and tracking status is LABEL_CREATED
    if (age > ms72h && order.trackingStatus === 'LABEL_CREATED') {
      await doc.ref.update({ late: true });
      lateSellers.add(order.sellerUid);
    }
  }

  // Update seller stats and tier for affected sellers
  for (const sellerUid of lateSellers) {
    await updateSellerTier(sellerUid);
  }

  return null;
});
