import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

export async function openConversation(
  firestore: any,
  currentUid: string,
  otherUid: string
) {
  if (!firestore || !currentUid || !otherUid) return null;

  const convosRef = collection(firestore, "conversations");

  // Look for an existing conversation
  const q = query(
    convosRef,
    where("participantUids", "array-contains", currentUid)
  );

  const snaps = await getDocs(q);
  for (const snap of snaps.docs) {
    const data = snap.data();
    if (data.participantUids?.includes(otherUid)) {
      return snap.id; // found existing convo
    }
  }

  // Otherwise create a new one
  const newConvo = {
    participantUids: [currentUid, otherUid],
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastMessageText: "",
    lastMessageSenderUid: "",
    lastMessageReadBy: [],
  };

  const docRef = await addDoc(convosRef, newConvo);
  return docRef.id;
}
