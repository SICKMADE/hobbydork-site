/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK.
admin.initializeApp();
const db = admin.firestore();

/**
 * A scheduled function that runs every hour to find and mark expired ISO24 posts.
 */
export const expireISO24Posts = onSchedule('every 60 minutes', async (event) => {
  logger.info('Running scheduled job to expire ISO24 posts...');
  const now = admin.firestore.Timestamp.now();

  // Query for active posts that have expired.
  const expiredPostsQuery = db
    .collection('iso24Posts')
    .where('status', '==', 'ACTIVE')
    .where('expiresAt', '<', now);

  const snapshot = await expiredPostsQuery.get();

  if (snapshot.empty) {
    logger.info('No expired ISO24 posts found.');
    return;
  }

  // Use a batch to update all expired posts at once for efficiency.
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    logger.info(`Expiring post: ${doc.id}`);
    batch.update(doc.ref, { status: 'EXPIRED' });
  });

  await batch.commit();
  logger.info(`Successfully expired ${snapshot.size} posts.`);
});

/**
 * A Firestore trigger that runs whenever a new review is created.
 * This function will recalculate the store's average rating and rating count.
 * This provides a robust, server-side alternative to the client-side calculation.
 */
export const onReviewCreated = onDocumentWritten(
  'storefronts/{storeId}/reviews/{reviewId}',
  async (event) => {
    // We only care about new documents (create events).
    if (!event.data?.after.exists || event.data?.before.exists) {
      logger.info('Not a new review, exiting function.');
      return;
    }

    const storeId = event.params.storeId;
    const newReview = event.data.after.data();

    if (!newReview) {
      logger.error('New review data is missing.');
      return;
    }

    const storeRef = db.doc(`storefronts/${storeId}`);

    try {
      await db.runTransaction(async (transaction) => {
        const storeDoc = await transaction.get(storeRef);
        if (!storeDoc.exists) {
          throw new Error('Store document not found!');
        }

        const storeData = storeDoc.data();
        if (!storeData) {
            throw new Error('Store data is empty!');
        }

        // Calculate new rating.
        const oldRatingTotal = (storeData.ratingAverage || 0) * (storeData.ratingCount || 0);
        const newRatingCount = (storeData.ratingCount || 0) + 1;
        const newAverage = (oldRatingTotal + newReview.rating) / newRatingCount;

        // Update the store document within the transaction.
        transaction.update(storeRef, {
          ratingAverage: newAverage,
          ratingCount: newRatingCount,
        });
      });
      logger.info(`Successfully updated ratings for store ${storeId}.`);
    } catch (error) {
      logger.error(`Failed to update ratings for store ${storeId}:`, error);
    }
  }
);


/**
 * A Firestore trigger that sends a notification to a user when their order's state changes.
 */
export const onOrderStateChange = onDocumentWritten('orders/{orderId}', async (event) => {
    // We only care about updates, not creations or deletions.
    if (!event.data?.before.exists || !event.data?.after.exists) {
        logger.info('Not an order update, exiting.');
        return;
    }

    const before = event.data.before.data();
    const after = event.data.after.data();

    // If the state hasn't changed, do nothing.
    if (before.state === after.state) {
        return;
    }

    const buyerUid = after.buyerUid;

    // Don't send a notification if the buyer UID is missing.
    if (!buyerUid) {
        logger.warn(`Order ${event.params.orderId} is missing a buyerUid.`);
        return;
    }

    const notificationRef = db.collection(`users/${buyerUid}/notifications`).doc();

    const newStatus = after.state.replace(/_/g, ' ').toLowerCase();

    const notificationPayload = {
        id: notificationRef.id,
        userUid: buyerUid,
        type: 'ORDER_STATUS',
        title: 'Order Update',
        body: `Your order #${event.params.orderId.substring(0, 7)} is now ${newStatus}.`,
        relatedId: event.params.orderId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
    };
    
    logger.info(`Sending notification to user ${buyerUid} for order ${event.params.orderId}`);
    await notificationRef.set(notificationPayload);
});
