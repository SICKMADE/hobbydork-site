
'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useAuth as useFirebaseAuth, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { placeholderImages } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface SignupData {
  email: string;
  password: string;
  displayName: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // This effect is now primarily for logging or future automatic actions
    // after a user's profile state changes.
    // The main email verification gating is handled in (app)/layout.tsx.
    if (user && user.emailVerified && profile?.status === 'ACTIVE' && !profile.emailVerified) {
        // This is a good place to ensure our DB is in sync if it somehow got out of sync.
        if (userProfileRef) {
          updateDoc(userProfileRef, { emailVerified: true });
        }
    }
  }, [user, profile, userProfileRef]);


  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
      });
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
      return false;
    }
  }, [auth, toast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/');
      router.refresh();
    } catch (error: any) {
       console.error("Logout failed:", error);
       toast({
        title: 'Logout Failed',
        description: error.message || 'Could not log you out.',
        variant: 'destructive',
      });
    }
  }, [auth, router, toast]);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    const { email, password, displayName } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await sendEmailVerification(newUser);
      toast({
          title: 'Verification Email Sent',
          description: 'Please check your inbox to verify your email address.',
      });
      
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName: displayName, 
        avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'ACTIVE',
        role: 'USER',
        isSeller: false,
        storeId: "",
        emailVerified: false,
        oneAccountAcknowledged: false,
        goodsAndServicesAgreed: false,
        paymentMethod: null,
        paymentIdentifier: null,
        notifyMessages: true,
        notifyOrders: true,
        notifyISO24: true,
        notifySpotlight: true,
        blockedUsers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newUserRef = doc(firestore, "users", newUser.uid);
      
      await setDoc(newUserRef, userProfile).catch(error => {
          const contextualError = new FirestorePermissionError({
            path: newUserRef.path,
            operation: 'create',
            requestResourceData: userProfile,
          });
          errorEmitter.emit('permission-error', contextualError);
          throw error;
      });
      
      router.push('/onboarding');
      return true;
    } catch (error: any) {
      console.error("Signup failed:", error);
      if (!(error instanceof FirestorePermissionError)) {
          toast({
            title: 'Signup Failed',
            description: error.message || 'An unexpected error occurred during sign up.',
            variant: 'destructive',
          });
      }
      return false;
    }
  }, [auth, firestore, toast, router]);

  const value = { 
      user,
      profile: profile || null, 
      loading: isUserLoading || isProfileLoading, 
      login, 
      logout, 
      signup 
    };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
