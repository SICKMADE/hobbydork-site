"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
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
} from "firebase/firestore";

import { auth, db } from "@/firebase/client-provider";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

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
  shippingAddress?: import("@/lib/types").ShippingAddress;
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
  shippingAddress: undefined,
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

    // NOTE: email verification changes do NOT trigger onAuthStateChanged.
    // onIdTokenChanged fires when tokens refresh (e.g. after getIdToken(true)),
    // so it keeps Firestore's users/{uid}.emailVerified in sync.
    const unsub = onIdTokenChanged(auth, (firebaseUser) => {
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
                  // Back-compat: older docs/inspectors may use lowercase.
                  emailverified: firebaseUser.emailVerified,
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
              emailverified: firebaseUser.emailVerified,
              displayName: firebaseUser.displayName ?? "",
              role: "USER",
              status: "ACTIVE",
              isSeller: false,
              sellerStatus: "NONE",
              storeId: "",
              avatar: getDefaultAvatarUrl(firebaseUser.uid),
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
    const current = auth.currentUser;
    if (!current) {
      throw new Error('Not signed in.');
    }

    // Ensure we have the latest emailVerified state.
    try {
      await (current.reload?.() ?? Promise.resolve());
    } catch {
      // ignore reload errors; still attempt send below
    }

    if (current.emailVerified) {
      return;
    }


    // Use environment variable for site URL if available
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hobbydork.com';
    const actionCodeSettings = {
      url: `${siteUrl}/verify-email`,
      handleCodeInApp: false,
    };

    try {
      await sendEmailVerification(current, actionCodeSettings);
    } catch (e: any) {
      const code = String(e?.code ?? '');


      // Always use production URL for continueUrl
      const continueUrl = 'https://hobbydork.com/verify-email';

      const domainHelpMessage =
        `Resend blocked by Firebase domain settings. ` +
        `In Firebase Console → Authentication → Settings → Authorized domains, add your site domain (e.g. hobbydork.com and www.hobbydork.com). ` +
        `Then set Vercel env NEXT_PUBLIC_SITE_URL=https://hobbydork.com and redeploy.` +
        (continueUrl ? ` (Continue URL: ${continueUrl})` : '');

      // If the domain/continue URL isn't whitelisted in Firebase, retry without settings.
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
