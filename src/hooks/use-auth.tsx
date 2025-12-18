"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/firebase/client-provider";

type AuthContextType = {
  user: User | null;
  userData: any | null;
  loading: boolean;
  profile?: any | null;
  error?: any | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<any>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = useProvideAuth();
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserData(snap.data());
      } else {
        // Create user doc if missing (first signup)
        await setDoc(ref, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName ?? "",
          role: "USER",
          status: "ACTIVE",
          isSeller: false,
          sellerStatus: "NONE",
          stripeAccountId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setUserData({
          role: "USER",
          status: "ACTIVE",
          isSeller: false,
          sellerStatus: "NONE",
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------- AUTH ACTIONS ---------- */

  const signInUser = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUpUser = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    if (cred.user) {
      await sendEmailVerification(cred.user);
    }

    return cred;
  };

  const logoutUser = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  };

  return {
    user,
    userData,
    // backward-compatible alias expected by callers
    profile: userData,
    loading,
    error,
    // alias names
    login: signInUser,
    signup: signUpUser,
    // original names (keep both)
    signIn: signInUser,
    signUp: signUpUser,
    logout: logoutUser,
    resendVerification,
  };
}
