import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/client-provider';
import type { User } from '@/lib/types';

/**

/**
 * Calculates and updates the seller tier for a given seller based on finalized rules:
 * - Bronze: default, <90% on-time shipping, >2 late/disputes in 60d, chargeback, or manual demotion
 * - Silver: >=90% on-time shipping, <=2 late/disputes in 60d, no chargebacks in 60d
 * - Gold: >=98% on-time shipping, 0 late/disputes/chargebacks in 60d, >=20 completed orders
 *
 * Also updates all relevant stat fields for backend enforcement.
 */
export async function updateSellerTier(sellerUid: string) {
  if (!db) return;
  const userRef = doc(db, 'users', sellerUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const user = userSnap.data() as User;

  // Fetch recent orders (last 60 days)
  const ordersRef = collection(db, 'orders');
  const ordersSnap = await getDocs(ordersRef);
  const now = Date.now();
  const ms60d = 60 * 24 * 60 * 60 * 1000;
  let completed = 0, onTime = 0, late = 0, disputes = 0, chargebacks = 0;
  ordersSnap.forEach(docSnap => {
    const o = docSnap.data();
    if (o.sellerUid !== sellerUid) return;
    if (!o.createdAt?.seconds) return;
    const created = o.createdAt.seconds * 1000;
    if (now - created > ms60d) return;
    if (o.state === 'DELIVERED' || o.state === 'COMPLETED') completed++;
    if (o.shippedAt?.seconds && o.createdAt?.seconds) {
      const shipped = o.shippedAt.seconds * 1000;
      if (shipped - created <= 2 * 24 * 60 * 60 * 1000) onTime++;
      else late++;
    }
    if (o.disputeId) disputes++;
    if (o.chargeback === true) chargebacks++;
  });
  const onTimeRate = completed > 0 ? onTime / completed : 0;

  // Tier logic (finalized spec)
  let tier: User['sellerTier'] = 'BRONZE';
  if (
    onTimeRate >= 0.98 && late === 0 && disputes === 0 && chargebacks === 0 && completed >= 20
  ) {
    tier = 'GOLD';
  } else if (
    onTimeRate >= 0.9 && late <= 2 && disputes <= 2 && chargebacks === 0
  ) {
    tier = 'SILVER';
  } else {
    tier = 'BRONZE';
  }

  // Update user doc with all relevant stats for enforcement and UI
  await updateDoc(userRef, {
    sellerTier: tier,
    onTimeShippingRate: onTimeRate,
    completedOrders: completed,
    lateShipmentsLast60d: late,
    disputesLast60d: disputes,
    chargebacksLast60d: chargebacks,
    lastTierChange: serverTimestamp(),
  });
}
