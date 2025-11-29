'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, limit } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useAuth as useFirebaseAuth, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { placeholderImages } from '@/lib/placeholder-images';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface SignupData {
  email: string;
  password: string;
  oneAccountAcknowledged: boolean;
  goodsAndServicesAgreed: boolean;
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
    // Check if the user is logged in, their email is verified, and their profile is currently 'LIMITED'
    if (user && user.emailVerified && profile?.status === 'LIMITED' && userProfileRef) {
      // Update the user's status to 'ACTIVE' in Firestore
      setDoc(userProfileRef, { status: 'ACTIVE', emailVerified: true, updatedAt: serverTimestamp() }, { merge: true })
        .then(() => {
          toast({
            title: 'Account Activated!',
            description: 'Your account has been fully activated. Welcome!',
          });
        })
        .catch((error) => {
          console.error('Error updating user status:', error);
          const contextualError = new FirestorePermissionError({
            path: userProfileRef.path,
            operation: 'update',
            requestResourceData: { status: 'ACTIVE', emailVerified: true },
          });
          errorEmitter.emit('permission-error', contextualError);
          toast({
            title: 'Activation Failed',
            description: 'Could not update your account status. Please contact support.',
            variant: 'destructive',
          });
        });
    }
  }, [user, profile, userProfileRef, toast]);


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
    const { email, password, oneAccountAcknowledged, goodsAndServicesAgreed } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'uid' | 'displayName'> & { createdAt: any, updatedAt: any, uid: string, displayName: string } = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName: "", // Display name is set during onboarding
        avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'ACTIVE', 
        role: 'user',
        emailVerified: true,
        oneAccountAcknowledged,
        goodsAndServicesAgreed,
        notificationPreferences: {
          notifyMessages: true,
          notifyOrders: true,
          notifyISO24: true,
          notifySpotlight: true,
        },
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
          throw error; // re-throw to be caught by outer catch
      });
      
      toast({
        title: 'Signup Successful!',
        description: `Welcome! Let's get your store set up.`,
      });
      // The redirect is handled by the AppLayout now
      return true;
    } catch (error: any) {
      console.error("Signup failed:", error);
      // Don't show a toast if it's a permission error, as it's handled globally
      if (!(error instanceof FirestorePermissionError)) {
          toast({
            title: 'Signup Failed',
            description: error.message || 'An unexpected error occurred during sign up.',
            variant: 'destructive',
          });
      }
      return false;
    }
  }, [auth, firestore, toast]);

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
