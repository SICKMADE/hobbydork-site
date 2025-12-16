import { db } from "@/firebase/client-provider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function sendNotification(uid: string, data: any) {
  await addDoc(collection(db, "notifications"), {
    uid,
    seen: false,
    createdAt: serverTimestamp(),
    ...data,
  });
}
