"use client";

import { useCallback, useRef } from "react";
import { useUser, useFirebase } from "@/firebase/provider";
import { User, UserCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, getFirestore, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import type { UserStatus } from "@/lib/types";

export type UserDoc = {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  username: string;
  role: string;
  status: UserStatus;
  isSeller: boolean;
  sellerStatus: string;
  storeId?: string;
  avatar?: string;
  bio?: string;
  notifyMessages: boolean;
  notifyOrders: boolean;
  notifyISO24: boolean;
  notifySpotlight: boolean;
  stripeOnboarded: boolean;
  stripeAccountId?: string | null;
  stripeTermsAgreed: boolean;
  paymentMethod: "STRIPE" | null;
  paymentIdentifier: string | null;
  createdAt: import('firebase/firestore').Timestamp | any;
  updatedAt: import('firebase/firestore').Timestamp | any;
  oneAccountAcknowledged: boolean;
  blockedUsers: string[];
  ownedPremiumProducts: string[];
  shippingAddress?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  [key: string]: unknown;
};

const EMPTY_USERDOC: UserDoc = {
  uid: "",
  email: "",
  emailVerified: false,
  displayName: "",
  username: "",
  role: "USER",
  status: "ACTIVE",
  isSeller: false,
  sellerStatus: "NONE",
  storeId: "",
  avatar: undefined,
  bio: "",
  notifyMessages: true,
  notifyOrders: true,
  notifyISO24: true,
  notifySpotlight: true,
  stripeOnboarded: false,
  stripeAccountId: null,
  stripeTermsAgreed: false,
  paymentMethod: null,
  paymentIdentifier: null,
  shippingAddress: undefined,
  oneAccountAcknowledged: false,
  blockedUsers: [],
  ownedPremiumProducts: [],
  createdAt: undefined as any,
  updatedAt: undefined as any,
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
  refreshProfile: () => Promise<UserDoc | void>;
};

export function useAuth(): AuthContextType {
  const { user, isUserLoading } = useUser();
  const { auth, firestore: db } = useFirebase();

  const refreshProfile = useCallback(async () => {
    if (!user || !db) return;
    try {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const existing = snap.data() as UserDoc;
        return { ...EMPTY_USERDOC, ...existing, emailVerified: user.emailVerified };
      }
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  }, [user, db]);

  const signInUser = useCallback((email: string, password: string) => {
    if (!auth) throw new Error("Firebase auth SDK not initialized.");
    return signInWithEmailAndPassword(auth, email, password);
  }, [auth]);

  const signUpUser = useCallback(async (
    email: string,
    password: string,
    displayName: string
  ) => {
    if (!auth) throw new Error("Firebase auth SDK not initialized.");
    if (!db) throw new Error("Firebase Firestore SDK not initialized.");
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (cred.user && displayName) {
        await updateProfile(cred.user, { displayName });
      }

      const ref = doc(db, 'users', cred.user.uid);
      await setDoc(ref, {
        uid: cred.user.uid,
        email: cred.user.email ?? '',
        emailVerified: false,
        displayName: displayName,
        role: 'USER',
        status: 'ACTIVE',
        isSeller: false,
        sellerStatus: 'NONE',
        storeId: '',
        bio: '',
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
        oneAccountAcknowledged: false,
        blockedUsers: [],
        ownedPremiumProducts: [],
      });

      if (cred.user) {
        await sendEmailVerification(cred.user);
      }

      return cred;
    } catch (e) {
      throw e;
    }
  }, [auth, db]);

  const logoutUser = useCallback(async () => {
    if (!auth) throw new Error("Firebase auth SDK not initialized.");
    try {
      await signOut(auth);
    } catch (e) {
      throw e;
    }
  }, [auth]);

  const resendVerification = useCallback(async () => {
    if (!auth) throw new Error("Firebase auth SDK not initialized.");
    const current = auth.currentUser;
    if (!current) {
      throw new Error('Not signed in.');
    }

    try {
      await (current.reload?.() ?? Promise.resolve());
    } catch {
      // ignore reload errors
    }

    if (current.emailVerified) {
      return;
    }

    try {
      await sendEmailVerification(current);
    } catch (e: any) {
      throw e;
    }
  }, [auth]);

  const authRef = useRef<AuthContextType | null>(null);
  
  if (!authRef.current ||
      authRef.current.user !== user ||
      authRef.current.loading !== isUserLoading ||
      authRef.current.login !== signInUser ||
      authRef.current.logout !== logoutUser) {
    authRef.current = {
      user,
      userData: EMPTY_USERDOC,
      profile: EMPTY_USERDOC,
      loading: isUserLoading,
      error: null,
      login: signInUser,
      signup: signUpUser,
      signIn: signInUser,
      signUp: signUpUser,
      logout: logoutUser,
      resendVerification,
      refreshProfile,
    };
  }

  return authRef.current as AuthContextType;
}
