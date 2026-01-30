import { getFirestore, doc, setDoc, deleteDoc, getDoc, collection, getDocs, query, where, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { enterStoreGiveaway } from "@/lib/storeGiveawayEntry";
import { getActiveGiveawayForSeller } from "@/lib/getActiveGiveawayForSeller";

const db = getFirestore();
const auth = getAuth();

// Follow a user
export async function followUser(targetUserId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (user.uid === targetUserId) throw new Error("Cannot follow yourself");
  if (!user.emailVerified) throw new Error("Email must be verified to follow");

  // Add to following subcollection
  await setDoc(doc(db, `users/${user.uid}/following/${targetUserId}`), {
    createdAt: serverTimestamp(),
    targetUserId,
  });
  // Add to followers subcollection of target
  await setDoc(doc(db, `users/${targetUserId}/followers/${user.uid}`), {
    createdAt: serverTimestamp(),
    followerUserId: user.uid,
  });

  // Check if the followed user is a seller with an active giveaway
  const activeGiveaway = await getActiveGiveawayForSeller(targetUserId);
  if (activeGiveaway) {
    // Only allow entry if user is ACTIVE (status) and email verified
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists() && userDoc.data().status === "ACTIVE" && user.emailVerified) {
      try {
        await enterStoreGiveaway({
          giveawayId: activeGiveaway.id,
          storeId: (activeGiveaway as any).storeId, // Use type assertion to bypass TS error
          sellerUid: targetUserId,
          userUid: user.uid,
        });
      } catch (e) {
        // Ignore duplicate entry errors
      }
    }
  }
}

// Unfollow a user
export async function unfollowUser(targetUserId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  if (user.uid === targetUserId) throw new Error("Cannot unfollow yourself");

  await deleteDoc(doc(db, `users/${user.uid}/following/${targetUserId}`));
  await deleteDoc(doc(db, `users/${targetUserId}/followers/${user.uid}`));
}

// Check if current user is following target
export async function isFollowing(targetUserId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  if (user.uid === targetUserId) return false;
  const docSnap = await getDoc(doc(db, `users/${user.uid}/following/${targetUserId}`));
  return docSnap.exists();
}

// Get follower count for a user
export async function getFollowerCount(userId: string): Promise<number> {
  const q = query(collection(db, `users/${userId}/followers`));
  const snap = await getDocs(q);
  return snap.size;
}

// Get following count for a user
export async function getFollowingCount(userId: string): Promise<number> {
  const q = query(collection(db, `users/${userId}/following`));
  const snap = await getDocs(q);
  return snap.size;
}

// Get list of followers
export async function getFollowers(userId: string): Promise<string[]> {
  const q = query(collection(db, `users/${userId}/followers`));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.id);
}

// Get list of following
export async function getFollowing(userId: string): Promise<string[]> {
  const q = query(collection(db, `users/${userId}/following`));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.id);
}
