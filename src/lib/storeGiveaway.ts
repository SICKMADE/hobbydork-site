import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export async function createGiveaway({
  storeId,
  ownerUid,
  title,
  description,
  imageUrl,
  prize,
  startAt,
  endAt
}: {
  storeId: string;
  ownerUid: string;
  title: string;
  description: string;
  imageUrl?: string;
  prize: string;
  startAt: Date;
  endAt: Date;
}) {
  if (!storeId || !ownerUid || !title || !prize || !startAt || !endAt) throw new Error("Missing required fields");
  return addDoc(collection(db, "storeGiveaways"), {
    storeId,
    ownerUid,
    title,
    description,
    imageUrl: imageUrl || null,
    prize,
    startAt,
    endAt,
    createdAt: serverTimestamp(),
    isActive: true,
    winnerUid: null,
    shipped: false,
    shippingTracking: null,
  });
}

export async function getStoreGiveaways(storeId: string) {
  const db = getFirestore();
  const q = collection(db, "storeGiveaways");
  // Filtering and ordering can be added as needed
  // ...
}

export async function getGiveaway(id: string) {
  const db = getFirestore();
  return getDoc(doc(db, "storeGiveaways", id));
}
