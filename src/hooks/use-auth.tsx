"use client";

import { useEffect, useState, createContext, useContext } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/firebase/client-provider";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: any) {
  const authState = useProvideAuth();
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

function useProvideAuth() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      // Load Firestore user doc
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setUser(firebaseUser);
        setUserData(null);
        setLoading(false);
        return;
      }

      const data = snap.data();

      // CHECK BAN
      if (data.status === "BANNED") {
        await signOut(auth);
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      // CHECK SUSPENSION
      if (data.status === "SUSPENDED") {
        const until = data.suspendUntil?.toDate();

        // still suspended
        if (until && until > new Date()) {
          // Still suspended → keep user signed in but blocked
          setUser(firebaseUser);
          setUserData({
            ...data,
            suspended: true,
            suspendedUntil: until,
          });
          setLoading(false);
          return;
        }

        // suspension expired → auto-restore user
        // (you MUST have a backend admin function that resets status to ACTIVE)
        // but for client, assume ACTIVE now
      }

      // NORMAL ACTIVE USER
      setUser(firebaseUser);
      setUserData({ ...data, suspended: false });
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return {
    user,
    userData,
    loading,
    signIn: (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
  };
}
