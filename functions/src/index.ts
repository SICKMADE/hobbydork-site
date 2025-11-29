/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;
const FieldValue = admin.firestore.FieldValue;

// Collection names – MUST match your app
const USERS = "users";
const STORES = "storefronts";
const LISTINGS = "listings";
const ORDERS = "orders";
const ISO24 = "iso24Posts";
const SPOTLIGHT = "spotlightSlots";
const CONVERSATIONS = "conversations";
const COMMUNITY = "communityMessages";

/**
 * Helper to write an in-app notification.
 */
async function createNotification(params: {
  userUid: string;
  type: "MESSAGE" | "ORDER" | "ORDER_STATUS" | "ISO24" | "SPOTLIGHT" | "GENERIC";
  title: string;
  body: string;
  relatedId?: string | null;
}): Promise<void> {
  const { userUid, type, title, body, relatedId = null } = params;
  const notifRef = db.collection(USERS).doc(userUid).collection("notifications").doc();

  await notifRef.set({
    notificationId: notifRef.id,
    userUid,
    type,
    title,
    body,
    relatedId,
    createdAt: Timestamp.now(),
    read: false,
  });
}

/**
 * ISO24: on create, ensure expiresAt is set to createdAt + 24h if missing.
 */
export const onIso24Create = functions
  .region("us-central1")
  .firestore.document(`${ISO24}/{isoId}`)
  .onCreate(async (snap: functions.firestore.DocumentSnapshot) => {
    const data = snap.data() || {};
    if (data.expiresAt) return null;

    const createdAt = data.createdAt || Timestamp.now();
    const expiresAt = new Timestamp(createdAt.seconds + 24 * 60 * 60, createdAt.nanoseconds);
    await snap.ref.update({ createdAt, expiresAt, status: "ACTIVE" });
    return null;
  });

/**
 * ISO24: scheduled job – mark expired posts as EXPIRED.
 */
export const expireIso24Posts = functions
  .region("us-central1")
  .pubsub.schedule("every 10 minutes")
  .onRun(async () => {
    const now = Timestamp.now();
    const q = db
      .collection(ISO24)
      .where("status", "==", "ACTIVE")
      .where("expiresAt", "<=", now)
      .limit(200);
    const snap = await q.get();
    const batch = db.batch();

    snap.docs.forEach((doc) => batch.update(doc.ref, { status: "EXPIRED" }));
    if (!snap.empty) await batch.commit();
    return null;
  });

/**
 * Reviews: on create, incrementally update store ratingAverage, ratingCount.
 * Note: itemsSold is handled in onOrderUpdate when order is COMPLETED.
 */
export const onReviewCreate = functions
  .region("us-central1")
  .firestore.document(`${STORES}/{storeId}/reviews/{reviewId}`)
  .onCreate(async (snap: functions.firestore.DocumentSnapshot) => {
    const data = snap.data() as any;
    const { storeId, rating } = data;
    if (!storeId || typeof rating !== "number") return null;

    const storeRef = db.collection(STORES).doc(storeId);
    await db.runTransaction(async (tx) => {
      const storeSnap = await tx.get(storeRef);
      if (!storeSnap.exists) return;
      const store = storeSnap.data() || {};

      const oldAvg = typeof store.ratingAverage === "number" ? store.ratingAverage : 0;
      const oldCount = typeof store.ratingCount === "number" ? store.ratingCount : 0;
      const newCount = oldCount + 1;
      const newAvg = (oldAvg * oldCount + rating) / newCount;

      tx.update(storeRef, {
        ratingAverage: newAvg,
        ratingCount: newCount,
      });
    });
    return null;
  });

/**
 * Spotlight: scheduled job – deactivate expired slots and clear store flags.
 */
export const expireSpotlightSlots = functions
  .region("us-central1")
  .pubsub.schedule("every 15 minutes")
  .onRun(async () => {
    const now = Timestamp.now();
    const q = db
      .collection(SPOTLIGHT)
      .where("active", "==", true)
      .where("endAt", "<=", now)
      .limit(200);

    const snap = await q.get();
    if (snap.empty) return null;

    const batch = db.batch();
    const storeUpdates: Record<string, FirebaseFirestore.DocumentReference> = {};

    snap.docs.forEach((doc) => {
      const data = doc.data();
      const storeId = data.storeId as string | undefined;
      batch.update(doc.ref, { active: false });
      if (storeId) storeUpdates[storeId] = db.collection(STORES).doc(storeId);
    });

    Object.values(storeUpdates).forEach((storeRef) => {
      batch.update(storeRef, { isSpotlighted: false, spotlightUntil: null });
    });

    await batch.commit();
    return null;
  });

/**
 * Orders: on create, send seller a notification.
 */
export const onOrderCreate = functions
  .region("us-central1")
  .firestore.document(`${ORDERS}/{orderId}`)
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const data = snap.data() as any;
    const { sellerUid, buyerUid, totalPrice } = data;

    if (sellerUid) {
      const buyerDoc = await db.collection(USERS).doc(buyerUid).get();
      const buyerName = buyerDoc.data()?.displayName || "A buyer";

      await createNotification({
        userUid: sellerUid,
        type: "ORDER",
        title: "New order received!",
        body: `You have a new order from ${buyerName} for $${Number(totalPrice || 0).toFixed(2)}.`,
        relatedId: context.params.orderId,
      });
    }
    return null;
  });

/**
 * Orders: on update, notify for status changes & inventory updates.
 */
export const onOrderUpdate = functions
  .region("us-central1")
  .firestore.document(`${ORDERS}/{orderId}`)
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    if (!before || !after) return null;

    const prevState = before.state as string | undefined;
    const newState = after.state as string | undefined;
    const orderId = context.params.orderId;
    const buyerUid = after.buyerUid as string | undefined;
    const sellerUid = after.sellerUid as string | undefined;

    const notifPromises: Promise<unknown>[] = [];

    // --- State Change Notifications ---
    if (prevState !== newState) {
      const stateLabelMap: Record<string, string> = {
        PENDING_PAYMENT: "Pending Payment",
        PAYMENT_SENT: "Payment Sent",
        SHIPPED: "Shipped",
        DELIVERED: "Delivered",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
      };
      const label = stateLabelMap[newState || ""] || newState || "Updated";

      if (buyerUid) {
        notifPromises.push(
          createNotification({
            userUid: buyerUid,
            type: "ORDER_STATUS",
            title: "Order Update",
            body: `Your order is now: ${label}.`,
            relatedId: orderId,
          })
        );
      }
      if (sellerUid) {
        notifPromises.push(
          createNotification({
            userUid: sellerUid,
            type: "ORDER_STATUS",
            title: "Order Update",
            body: `Order ${orderId.substring(0,7)} is now: ${label}.`,
            relatedId: orderId,
          })
        );
      }
    }

    // --- Inventory & Sales Count Logic on Completion ---
    if (newState === "COMPLETED" && prevState !== "COMPLETED") {
      const items: any[] = Array.isArray(after.items) ? after.items : [];
      const batch = db.batch();
      let totalQuantity = 0;

      for (const item of items) {
        const listingId = item.listingId as string | undefined;
        const quantity = Number(item.quantity || 0);
        if (!listingId || quantity <= 0) continue;

        totalQuantity += quantity;
        // We no longer decrement stock here. Stock is decremented at checkout.
        // This function's role on completion is to update store-level stats.
      }
      
      // Increment total items sold for the store
      if (after.storeId && totalQuantity > 0) {
        const storeRef = db.collection(STORES).doc(after.storeId);
        batch.update(storeRef, { itemsSold: FieldValue.increment(totalQuantity) });
      }

      if (totalQuantity > 0) {
        notifPromises.push(batch.commit());
      }
    }

    await Promise.all(notifPromises);
    return null;
  });

/**
 * Messaging: notify other participants on new messages.
 */
export const onMessageCreate = functions
  .region("us-central1")
  .firestore.document(`${CONVERSATIONS}/{conversationId}/messages/{messageId}`)
  .onCreate(async (snap: functions.firestore.DocumentSnapshot, context: functions.EventContext) => {
    const message = snap.data() as any;
    const { senderUid, text } = message;
    const conversationId = context.params.conversationId;

    const convoRef = db.collection(CONVERSATIONS).doc(conversationId);
    const convoSnap = await convoRef.get();
    if (!convoSnap.exists) return null;

    const convo = convoSnap.data() as any;
    const participantUids: string[] = Array.isArray(convo.participantUids) ? convo.participantUids : [];
    
    const senderDoc = await db.collection(USERS).doc(senderUid).get();
    const senderName = senderDoc.data()?.displayName || "Someone";

    const updatePayload: { [key: string]: any } = {
      lastMessageAt: Timestamp.now(),
    };
    if (text) {
      updatePayload.lastMessageText = text;
    }
    
    await convoRef.update(updatePayload);

    const notifPromises: Promise<unknown>[] = [];
    participantUids.forEach((uid) => {
      if (!uid || uid === senderUid) return;
      notifPromises.push(
        createNotification({
          userUid: uid,
          type: "MESSAGE",
          title: `New message from ${senderName}`,
          body: text ? String(text).slice(0, 80) : "You have a new message.",
          relatedId: conversationId,
        })
      );
    });

    await Promise.all(notifPromises);
    return null;
  });

/**
 * Spotlight notifications.
 */
export const onSpotlightUpdate = functions
  .region("us-central1")
  .firestore.document(`${SPOTLIGHT}/{slotId}`)
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>) => {
    const before = change.before.data() as any;
    const after = change.after.data() as any;
    if (!before || !after) return null;

    const justActivated = !before.active && after.active;
    const storeId = after.storeId as string | undefined;
    const ownerUid = after.ownerUid as string | undefined;
    if (!ownerUid) return null;

    if (justActivated) {
      await createNotification({
        userUid: ownerUid,
        type: "SPOTLIGHT",
        title: "You're in the Spotlight!",
        body: "Your store is now being featured on the homepage.",
        relatedId: storeId || null,
      });
    }

    return null;
  });
