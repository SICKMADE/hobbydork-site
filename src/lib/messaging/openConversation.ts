import { collection, query, where, getDocs, addDoc, serverTimestamp, Firestore } from "firebase/firestore";

// Import useAuth or pass canReadFirestore as a parameter if needed

  firestore: Firestore,
  currentUid: string,
  otherUid: string
) {

  // Strict Firestore read gate
  // You may want to pass canReadFirestore as a parameter, or import your auth/profile logic here
  // For now, add a placeholder check (replace with your actual canReadFirestore logic)
  const canReadFirestore = Boolean(firestore && currentUid && otherUid); // TODO: Replace with strict check
  if (!canReadFirestore) return null;

  const convosRef = collection(firestore, "conversations");

  // Look for an existing conversation
  let convoId: string | null = null;
  if (canReadFirestore) {
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
