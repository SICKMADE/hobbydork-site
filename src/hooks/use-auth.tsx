"use client";

import { useCallback, useRef } from "react";
import { useUser, useFirebase } from "@/firebase/provider";
import { User, UserCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, getFirestore, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import type { UserStatus } from "@/lib/types";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

export type UserDoc = {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  role: string;
  status: UserStatus;
  isSeller: boolean;
  sellerStatus: string;
  storeId?: string;
  avatar?: string;
  about?: string;
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
  shippingAddress: undefined,
  oneAccountAcknowledged: false,
  blockedUsers: [],
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

/**
 * useAuth is a wrapper around the Firebase provider's useUser hook.
 * It provides a familiar interface while using the centralized auth system.
 */
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
        avatar: getDefaultAvatarUrl(cred.user.uid),
        about: '',
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
      });

      if (cred.user) {
        const actionCodeSettings = {
          url: 'https://hobbydork.com/login',
          handleCodeInApp: false,
        };
        await sendEmailVerification(cred.user, actionCodeSettings);
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
      const actionCodeSettings = {
        url: 'https://hobbydork.com/login',
        handleCodeInApp: false,
      };
      await sendEmailVerification(current, actionCodeSettings);
    } catch (e: any) {
      const code = String(e?.code ?? '');
      const continueUrl = 'https://hobbydork.com/verify-email';

      const domainHelpMessage =
        `Resend blocked by Firebase domain settings. ` +
        `In Firebase Console → Authentication → Settings → Authorized domains, add your site domain (e.g. hobbydork.com and www.hobbydork.com). ` +
        `Then set Vercel env NEXT_PUBLIC_SITE_URL=https://hobbydork.com and redeploy.` +
        (continueUrl ? ` (Continue URL: ${continueUrl})` : '');

      if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
        try {
          await sendEmailVerification(current);
          return;
        } catch (e2: any) {
          const code2 = String(e2?.code ?? '');
          if (code2 === 'auth/too-many-requests') {
            throw new Error('Too many attempts. Please wait a bit and try again.');
          }

          if (code2 === 'auth/unauthorized-continue-uri' || code2 === 'auth/invalid-continue-uri') {
            throw new Error(`${domainHelpMessage} (Firebase: ${code2})`);
          }

          throw new Error(e2?.message ?? 'Could not resend verification email.');
        }
      }

      if (code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please wait a bit and try again.');
      }

      if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
        throw new Error(`${domainHelpMessage} (Firebase: ${code})`);
      }

      throw new Error(e?.message ?? 'Could not resend verification email.');
    }
  }, [auth]);

  // Use ref to memoize the return object - only create new object if dependencies change
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

// Utility: Check all sellers for overdue unshipped orders and flag their profile
export async function flagOverdueSellers() {
  const db = getFirestore();
  // Cleaned: find overdue paid orders
  const ordersRef = collection(db, 'orders');
  const now = Date.now();
  const twoBusinessDaysMs = 2 * 24 * 60 * 60 * 1000;
  const q = query(ordersRef, where('state', '==', 'PAID'));
  const snap = await getDocs(q);
  const overdueSellers = new Set<string>();
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const created = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : new Date(data.createdAt).getTime();
    if (now - created > twoBusinessDaysMs && typeof data.sellerUid === 'string') {
      overdueSellers.add(data.sellerUid);
    }
  });
  // Flag each seller profile
  for (const sellerUid of overdueSellers) {
    const userRef = doc(db, 'users', sellerUid);
    await updateDoc(userRef, { hasOverdueShipments: true });
  }
}
