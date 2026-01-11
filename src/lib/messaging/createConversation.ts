import { addDoc, collection, serverTimestamp, Firestore } from "firebase/firestore";

export async function createConversation(
  firestore: Firestore,
  participantUids: string[]
): Promise<string | null> {
  if (!firestore || !participantUids?.length) return null;

  const ref = collection(firestore, "conversations");

  const convo = {
    participantUids,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastMessageSenderUid: "",
    lastMessageText: "",
    lastMessageReadBy: [],
  };

  const docRef = await addDoc(ref, convo);
  return docRef.id;
}
