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
  updateProfile,
  User,
  UserCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "@/firebase/client-provider";

type UserDoc = {
  uid: string;
  email: string | null;
  emailVerified?: boolean;
  displayName: string;
  role: string;
  status: string;
  isSeller: boolean;
  sellerStatus: string;
  storeId?: string;
  avatar?: string;
  about?: string;
  notifyMessages?: boolean;
  notifyOrders?: boolean;
  notifyISO24?: boolean;
  notifySpotlight?: boolean;
  stripeOnboarded?: boolean;
  stripeAccountId: string | null;
  stripeTermsAgreed: boolean;
  paymentMethod: string | null;
  paymentIdentifier: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  [key: string]: unknown;
};

const EMPTY_USERDOC: UserDoc = {
  uid: "",
  email: null,
  emailVerified: false,
  displayName: "",
  role: "USER",
  status: "ACTIVE",
  isSeller: false,
  sellerStatus: "NONE",
  storeId: "",
  avatar: undefined,
  about: "",
  notifyMessages: true,
  notifyOrders: true,
  notifyISO24: true,
  notifySpotlight: true,
  stripeOnboarded: false,
  stripeAccountId: null,
  stripeTermsAgreed: false,
  paymentMethod: null,
  paymentIdentifier: null,
};

type AuthContextType = {
  user: User | null;
  userData: UserDoc;
  loading: boolean;
  profile: UserDoc;
  error?: unknown | null;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<UserCredential>;
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
  const [userData, setUserData] = useState<UserDoc>(EMPTY_USERDOC);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Defensive: if client SDKs aren't available yet, fail gracefully.
    if (!auth || !db) {
      setError(new Error("Firebase client SDKs not initialized."));
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      (async () => {
        try {
          if (!isMounted) return;
          setError(null);

          if (!firebaseUser) {
            setUser(null);
            setUserData(EMPTY_USERDOC);
            return;
          }

          setUser(firebaseUser);

          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);

          if (snap.exists()) {
            const existing = snap.data() as UserDoc;
            // Keep Firestore doc in sync with Auth verification state.
            if (existing.emailVerified !== firebaseUser.emailVerified) {
              try {
                await updateDoc(ref, {
                  emailVerified: firebaseUser.emailVerified,
                  updatedAt: serverTimestamp(),
                });
              } catch (_e) {
                // ignore permissions/offline; UI gating uses Auth state
              }
            }

            setUserData({
              ...EMPTY_USERDOC,
              ...existing,
              emailVerified: firebaseUser.emailVerified,
            });
          } else {
            // Create user doc if missing (first signup)
            const newUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName ?? "",
              role: "USER",
              status: "ACTIVE",
              isSeller: false,
              sellerStatus: "NONE",
              storeId: "",
              avatar: undefined,
              about: "",
              notifyMessages: true,
              notifyOrders: true,
              notifyISO24: true,
              notifySpotlight: true,
              stripeOnboarded: false,
              stripeAccountId: null,
              stripeTermsAgreed: false,
              paymentMethod: null,
              paymentIdentifier: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            } satisfies UserDoc;
            await setDoc(ref, newUserData);
            setUserData({
              ...EMPTY_USERDOC,
              ...newUserData,
              // avoid leaking FieldValue into UI state; keep minimal fields
              createdAt: undefined,
              updatedAt: undefined,
            });
          }
        } catch (e) {
          if (!isMounted) return;
          setError(e);
          // If something fails (e.g. Firestore permissions/offline), avoid leaving UI stuck.
          setUserData(EMPTY_USERDOC);
        } finally {
          if (!isMounted) return;
          setLoading(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  /* ---------- AUTH ACTIONS ---------- */

  const signInUser = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);

  const signUpUser = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (cred.user && displayName) {
        await updateProfile(cred.user, { displayName });
      }

      if (cred.user) {
        await sendEmailVerification(cred.user);
      }

      return cred;
    } catch (e) {
      setError(e);
      throw e;
    }
  };

  const logoutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(EMPTY_USERDOC);
    } catch (e) {
      setError(e);
      // log for easier local debugging
      // eslint-disable-next-line no-console
      console.error('logoutUser error', e);
      throw e;
    }
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
