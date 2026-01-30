// Get all entries for a giveaway
export interface StoreGiveawayEntry {
  id: string;
  userUid: string;
  displayName?: string;
  [key: string]: any;
}

export async function getStoreGiveawayEntries(giveawayId: string): Promise<StoreGiveawayEntry[]> {
  const q = query(
    collection(db, "storeGiveawayEntries"),
    where("giveawayId", "==", giveawayId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userUid: data.userUid ?? "",
      displayName: data.displayName,
      ...data,
    };
  });
}

// Pick a random winner and return the entry. Also update the giveaway doc with winnerUid.
export async function pickStoreGiveawayWinner(giveawayId: string) {
  const entries = await getStoreGiveawayEntries(giveawayId);
  if (!entries.length) throw new Error("No entries to pick from");
  const winner = entries[Math.floor(Math.random() * entries.length)];
  // Update the giveaway doc with winnerUid
  const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
  const db = getFirestore();
  await updateDoc(doc(db, "storeGiveaways", giveawayId), { winnerUid: winner.userUid });
  return winner;
}

import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

const db = getFirestore();

export async function enterStoreGiveaway({
  giveawayId,
  storeId,
  sellerUid,
  userUid,
}: {
  giveawayId: string;
  storeId: string;
  sellerUid: string;
  userUid: string;
}) {
  // Only allow one entry per user per giveaway
  const q = query(
    collection(db, "storeGiveawayEntries"),
    where("giveawayId", "==", giveawayId),
    where("userUid", "==", userUid)
  );
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error("You already have an entry for this giveaway.");
  return addDoc(collection(db, "storeGiveawayEntries"), {
    giveawayId,
    storeId,
    sellerUid,
    userUid,
    createdAt: serverTimestamp(),
    entryType: "follow", // or "manual" if you want to support other entry types
  });
}

export async function endStoreGiveaway(giveawayId: string) {
  await updateDoc(doc(db, "storeGiveaways", giveawayId), {
    isActive: false,
    endAt: serverTimestamp(),
  });
}
