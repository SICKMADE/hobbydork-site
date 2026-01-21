import { collection, query, where, getDocs, addDoc, serverTimestamp, Firestore } from "firebase/firestore";

// Import useAuth or pass canReadFirestore as a parameter if needed

export async function openConversation(
  firestore: Firestore,
  currentUid: string,
  otherUid: string
): Promise<string | null> {
  // Strict Firestore read gate: Only allow if all UIDs are present and not empty
  if (!firestore || !currentUid || !otherUid) return null;
  // Optionally: Add more checks for user status, email verification, etc. if available
  // Example: Pass user/profile object and check status === 'ACTIVE', emailVerified === true

  const convosRef = collection(firestore, "conversations");

  // Look for an existing conversation
  let convoId: string | null = null;
  const q = query(
    convosRef,
    where("participantUids", "array-contains", currentUid)
  );
  const snaps = await getDocs(q);
  for (const snap of snaps.docs) {
    const data = snap.data();
    if (data.participantUids?.includes(otherUid)) {
      convoId = snap.id; // found existing convo
      break;
    }
  }
  if (convoId) return convoId;

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
