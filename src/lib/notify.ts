
import { db } from "@/firebase/client-provider";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Notification } from "@/lib/types";

// Send a notification to a user (used for messages, orders, etc)
export async function sendNotification(uid: string, data: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
	if (!db) return;
	await addDoc(collection(db, "users", uid, "notifications"), {
		...data,
		read: false,
		createdAt: serverTimestamp(),
	});
}
