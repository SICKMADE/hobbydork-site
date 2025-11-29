// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

/**
 * A scheduled function that runs periodically (e.g., every hour)
 * to find and mark expired ISO24 posts.
 */
export const expireISO24Posts = functions.pubsub
  .schedule("every 60 minutes")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Query for active posts that have expired
    const expiredPostsQuery = db.collection("iso24Posts")
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<", now);
      
    const snapshot = await expiredPostsQuery.get();
    
    if (snapshot.empty) {
      console.log("No expired ISO24 posts found.");
      return null;
    }
    
    // Use a batch to update all expired posts at once
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      console.log(`Expiring post: ${doc.id}`);
      batch.update(doc.ref, { status: "EXPIRED" });
    });
    
    await batch.commit();
    console.log(`Successfully expired ${snapshot.size} posts.`);
    return null;
  });

/**
 * A Firestore trigger that runs whenever a new review is created.
 * This function will recalculate the store's average rating.
 * NOTE: The client-side app already does this in a transaction.
 * This is the backend equivalent and is a more robust solution.
 * You can use one or the other.
 */
export const onReviewCreated = functions.firestore
    .document("storefronts/{storeId}/reviews/{reviewId}")
    .onCreate(async (snap, context) => {
        const storeId = context.params.storeId;
        const newReview = snap.data();
        
        const storeRef = db.doc(`storefronts/${storeId}`);
        
        return db.runTransaction(async (transaction) => {
            const storeDoc = await transaction.get(storeRef);
            if (!storeDoc.exists) {
                throw new Error("Store document not found!");
            }
            
            const storeData = storeDoc.data()!;
            
            // Calculate new rating
            const oldRatingTotal = (storeData.ratingAverage || 0) * (storeData.ratingCount || 0);
            const newRatingCount = (storeData.ratingCount || 0) + 1;
            const newAverage = (oldRatingTotal + newReview.rating) / newRatingCount;

            // Update the store document
            return transaction.update(storeRef, {
                ratingAverage: newAverage,
                ratingCount: newRatingCount,
            });
        });
    });


/**
 * A Firestore trigger that sends a notification when an order's state changes.
 */
export const onOrderStateChange = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // If the state hasn't changed, do nothing.
        if (before.state === after.state) {
            return null;
        }

        const buyerUid = after.buyerUid;
        const notificationRef = db.collection(`users/${buyerUid}/notifications`).doc();

        const notificationPayload = {
            id: notificationRef.id,
            userUid: buyerUid,
            type: "ORDER_STATUS",
            title: "Order Update",
            body: `Your order #${after.orderId.substring(0, 7)} is now ${after.state.replace('_', ' ')}.`,
            relatedId: after.orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
        };

        return notificationRef.set(notificationPayload);
    });
