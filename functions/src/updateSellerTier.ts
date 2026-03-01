import * as admin from 'firebase-admin';

function getTier(completedOrders: number, onTimeShippingRate: number, lateShipmentsLast30d: number): 'BRONZE' | 'SILVER' | 'GOLD' {
  if (completedOrders >= 100 && onTimeShippingRate >= 0.97 && lateShipmentsLast30d <= 1) {
    return 'GOLD';
  }
  if (completedOrders >= 20 && onTimeShippingRate >= 0.9 && lateShipmentsLast30d <= 5) {
    return 'SILVER';
  }
  return 'BRONZE';
}

export async function updateSellerTier(sellerUid: string): Promise<void> {
  const db = admin.firestore();
  const now = Date.now();
  const ms30d = 30 * 24 * 60 * 60 * 1000;
  const ms60d = 60 * 24 * 60 * 60 * 1000;

  const ordersSnap = await db.collection('orders').where('sellerUid', '==', sellerUid).get();

  let completedOrders = 0;
  let lateShipmentsLast30d = 0;
  let lateShipmentsLast60d = 0;
  let fulfilledLast60d = 0;

  for (const orderDoc of ordersSnap.docs) {
    const order = orderDoc.data() as any;
    const createdAtMs = order?.createdAt?.toDate ? order.createdAt.toDate().getTime() : null;

    if (order?.state === 'DELIVERED' || order?.state === 'COMPLETED') {
      completedOrders += 1;
    }

    if (!createdAtMs) {
      continue;
    }

    const age = now - createdAtMs;
    if (age <= ms60d) {
      fulfilledLast60d += 1;
      if (order?.late === true) {
        lateShipmentsLast60d += 1;
      }
    }
    if (age <= ms30d && order?.late === true) {
      lateShipmentsLast30d += 1;
    }
  }

  const onTimeShippingRate =
    fulfilledLast60d > 0
      ? Math.max(0, Math.min(1, (fulfilledLast60d - lateShipmentsLast60d) / fulfilledLast60d))
      : 1;

  const nextTier = getTier(completedOrders, onTimeShippingRate, lateShipmentsLast30d);

  const userRef = db.collection('users').doc(sellerUid);
  const userSnap = await userRef.get();
  const prevTier = (userSnap.data()?.sellerTier as 'BRONZE' | 'SILVER' | 'GOLD' | undefined) ?? null;

  const updatePayload: Record<string, unknown> = {
    sellerTier: nextTier,
    completedOrders,
    onTimeShippingRate,
    lateShipmentsLast30d,
    lateShipmentsLast60d,
  };

  if (prevTier !== nextTier) {
    updatePayload.lastTierChange = admin.firestore.FieldValue.serverTimestamp();
  }

  await userRef.set(updatePayload, { merge: true });
}