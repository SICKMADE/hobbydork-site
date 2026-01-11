"use client";


import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut, sendEmailVerification } from 'firebase/auth';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/client';
import { getDefaultAvatarUrl } from '@/lib/default-avatar';
// If UserDoc is not exported, fallback to a generic type
// Remove the next line and use the fallback if import fails
import type { User as UserDoc } from '@/lib/types';



// Define the shape of the AuthContext
interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserDoc | null;
  profile: UserDoc | null; // alias for userData
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
  logout: () => Promise<void>; // alias for signOut
  signIn?: (...args: any[]) => any;
  signUp?: (...args: any[]) => any;
  resendVerification?: () => Promise<void>;
}

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<UserDoc | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user profile from Firestore
    const fetchUserProfile = useCallback(async (uid: string) => {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserDoc);
        } else {
          setUserData(null);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user profile');
        setUserData(null);
      }
    }, []);

    // Listen for Firebase Auth state changes
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(true);
        setError(null);
        if (firebaseUser) {
          await fetchUserProfile(firebaseUser.uid);
        } else {
          setUserData(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }, [fetchUserProfile]);

    // Manual profile refresh
    const refreshProfile = useCallback(async () => {
      if (user) {
        setLoading(true);
        await fetchUserProfile(user.uid);
        setLoading(false);
      }
    }, [user, fetchUserProfile]);

    // Sign out
    const signOut = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        await firebaseSignOut(auth);
        setUser(null);
        setUserData(null);
      } catch (err: any) {
        setError(err.message || 'Sign out failed');
      } finally {
        setLoading(false);
      }
    }, []);

    // Send email verification
    const sendVerification = useCallback(async () => {
      if (user) {
        try {
          await sendEmailVerification(user);
        } catch (err: any) {
          setError(err.message || 'Failed to send verification email');
        }
      }
    }, [user]);

    // Backward-compatible aliases
    const logout = signOut;
    const profile = userData;
    // Placeholder signIn for legacy consumers
    const signIn = undefined;

    // Email/password sign up implementation
    const signUp = useCallback((email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        initiateEmailSignUp(auth, email, password);
      } catch (err: any) {
        setError(err.message || 'Sign up failed');
      } finally {
        setLoading(false);
      }
    }, []);
    const resendVerification = useCallback(async () => {
      if (!user) throw new Error('No user is logged in.');
      try {
        await sendEmailVerification(user);
      } catch (err: any) {
        throw new Error(err.message || 'Failed to send verification email');
      }
    }, [user]);

    const value: AuthContextType = {
      user,
      userData,
      profile,
      loading,
      error,
      refreshProfile,
      signOut,
      sendVerification,
      logout,
      signIn,
      signUp,
      resendVerification,
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };

  export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  }
