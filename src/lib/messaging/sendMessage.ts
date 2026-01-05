import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  Firestore,
} from "firebase/firestore";

/**
 * Sends a message in a conversation.
 */
  conversationId: string,
  senderUid: string,
  text: string,
  firestore: Firestore
) {
  if (!conversationId || !senderUid || !firestore) {
    console.error("sendMessage() missing required args.");
    return;
  }

  // Create message
  const messagesRef = collection(
    firestore,
    "conversations",
    conversationId,
    "messages"
  );

  const newMessage = {
    senderUid,
    text,
    createdAt: serverTimestamp(),
    readBy: [], // read receipts support
  };

  // Add message
  const docRef = await addDoc(messagesRef, newMessage);

  // Attach its messageId
  await updateDoc(docRef, {
    messageId: docRef.id,
  });

  // Update the parent conversation document
  const convoRef = doc(firestore, "conversations", conversationId);

  await updateDoc(convoRef, {
    lastMessageText: text,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderUid: senderUid,
    // sender hasn't read it yet
    lastMessageReadBy: [], 
  });

  return docRef.id;
}
