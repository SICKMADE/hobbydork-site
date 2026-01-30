import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export async function getUserProfiles(uids: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  await Promise.all(
    uids.map(async (uid) => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        results[uid] = snap.data();
      }
    })
  );
  return results;
}
