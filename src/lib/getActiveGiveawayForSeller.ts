import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

const db = getFirestore();

export async function getActiveGiveawayForSeller(sellerUid: string) {
  // Find an active giveaway for this seller (isActive, endAt in future)
  const now = new Date();
  const q = query(
    collection(db, "storeGiveaways"),
    where("ownerUid", "==", sellerUid),
    where("isActive", "==", true),
    // Firestore doesn't support direct date comparison in compound queries, so filter after fetch
  );
  const snap = await getDocs(q);
  const active = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; [key: string]: any }))
    .find(g => g.endAt && new Date(g.endAt) > now);
  return active || null;
}
