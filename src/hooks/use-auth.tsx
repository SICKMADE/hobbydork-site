"use client";

import { useEffect, useState, createContext, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, db } from "@/firebase/client-provider";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const authState = useProvideAuth();
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};

function useProvideAuth() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setUser(firebaseUser);
        setUserData(null);
        setLoading(false);
        return;
      }

      const data = snap.data();

      // BANNED
      if (data.status === "BANNED") {
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      // SUSPENDED
      if (data.status === "SUSPENDED") {
        const until = data.suspendUntil?.toDate();

        if (until && until > new Date()) {
          setUser(firebaseUser);
          setUserData({
            ...data,
            suspended: true,
            suspendedUntil: until,
          });
          setLoading(false);
          return;
        }
        // suspension expired → fall through as ACTIVE
      }

      // ACTIVE
      setUser(firebaseUser);
      setUserData({ ...data, suspended: false });
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔑 IMPORTANT: expose BOTH names
  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
    router.push("/login");
  };

  // Signup implementation
  const signup = async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
    // Create user in Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
    }
    // Create user document in Firestore
    const userRef = doc(db, "users", cred.user.uid);
    await setDoc(userRef, {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName,
      role: "USER",
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isSeller: false,
      emailVerified: cred.user.emailVerified,
      oneAccountAcknowledged: false,
      goodsAndServicesAgreed: false,
      notifyMessages: true,
      notifyOrders: true,
      notifyISO24: true,
      notifySpotlight: true,
      blockedUsers: [],
    });
    setUser(cred.user);
    setUserData({
      uid: cred.user.uid,
      email: cred.user.email,
      displayName,
      role: "USER",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      isSeller: false,
      emailVerified: cred.user.emailVerified,
      oneAccountAcknowledged: false,
      goodsAndServicesAgreed: false,
      notifyMessages: true,
      notifyOrders: true,
      notifyISO24: true,
      notifySpotlight: true,
      blockedUsers: [],
    });
  };

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  return {
    user,
    userData,
    loading,
    signIn,
    login: signIn, // alias for compatibility
    signup,
    // keep signOut for legacy usage
    signOut: logout,
    logout,
  };
}
