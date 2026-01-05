"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onIdTokenChanged,
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
  Firestore,
  onSnapshot,
} from "firebase/firestore";

import { auth as _auth, db as _db } from "@/firebase/client-provider";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

/* ---------------- TYPES ---------------- */

export type UserDoc = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  status: "ACTIVE" | "LIMITED" | "BANNED";
  isSeller: boolean;
  sellerStatus: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  storeId: string;
  avatar: string;
  about: string;
  notifyMessages: boolean;
  notifyOrders: boolean;
  notifyISO24: boolean;
  notifySpotlight: boolean;
  stripeOnboarded: boolean;
  stripeAccountId: string | null;
  stripeTermsAgreed: boolean;
  paymentMethod: string | null;
  paymentIdentifier: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  shippingAddress?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
};

const EMPTY_PROFILE: UserDoc = {
  uid: "",
  email: null,
  emailVerified: false,
  displayName: "",
  role: "USER",
  status: "ACTIVE",
  isSeller: false,
  sellerStatus: "NONE",
  storeId: "",
  avatar: "",
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

/* ---------------- CONTEXT ---------------- */

type AuthContextType = {
  user: User | null;
  profile: UserDoc | null;
  userData: UserDoc;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<UserCredential>;
  refreshIdToken: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/* ---------------- CORE ---------------- */

function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_auth || !_db) return;

    const db: Firestore = _db;
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onIdTokenChanged(_auth, async (firebaseUser) => {
      setLoading(true);

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // 🔥 THIS IS THE FIX
      await firebaseUser.reload();
          
      setUser(firebaseUser);
      const ref = doc(db, "users", firebaseUser.uid);

      unsubProfile = onSnapshot(ref, async (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserDoc;
          if (data.emailVerified !== firebaseUser.emailVerified) {
            await updateDoc(ref, {
              emailVerified: firebaseUser.emailVerified,
              updatedAt: serverTimestamp(),
            });
          }
          setProfile({
            ...EMPTY_PROFILE,
            ...data,
            emailVerified: firebaseUser.emailVerified,
          });
        } else {
          const newUser: UserDoc = {
            ...EMPTY_PROFILE,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName ?? "",
            avatar: getDefaultAvatarUrl(firebaseUser.uid),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(ref, newUser);
          setProfile(newUser);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  /* ---------------- ACTIONS ---------------- */

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(_auth!, email, password);

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(
      _auth!,
      email,
      password
    );

    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    return cred;
  };

  const logout = async () => {
    await signOut(_auth!);
    setUser(null);
    setProfile(null);
  };

  const resendVerification = async () => {
    if (!_auth?.currentUser) throw new Error("Not signed in");
    await sendEmailVerification(_auth.currentUser);
  };

  // Helper to force-refresh the ID token (e.g., after email verification)
  const refreshIdToken = async () => {
    if (_auth?.currentUser) {
      await _auth.currentUser.getIdToken(true);
    }
  };

  // userData is a non-nullable version of profile, fallback to EMPTY_PROFILE
  const userData = profile ?? EMPTY_PROFILE;
  return {
    user,
    profile,
    userData,
    loading,
    login,
    signup,
    signIn: login,
    signUp: signup,
    logout,
    resendVerification,
    refreshIdToken,
  };
}
