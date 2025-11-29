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
  displayName: string;
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
    if (user && profile?.status === 'LIMITED' && user.emailVerified && userProfileRef) {
      setDoc(userProfileRef, { status: 'ACTIVE', emailVerified: true, updatedAt: serverTimestamp() }, { merge: true })
        .catch((error) => {
          console.error('Error updating user status:', error);
          const contextualError = new FirestorePermissionError({
            path: userProfileRef.path,
            operation: 'update',
            requestResourceData: { status: 'ACTIVE', emailVerified: true },
          });
          errorEmitter.emit('permission-error', contextualError);
        });
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
    const { displayName, email, password } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'uid' | 'storeId'> & { createdAt: any, updatedAt: any, uid: string } = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName, // Will be updated in onboarding
        avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'ACTIVE', // Default to ACTIVE
        role: 'user', // All new users are 'user'
        emailVerified: true, // Skipping verification
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
      await setDoc(newUserRef, userProfile);
      
      toast({
        title: 'Signup Successful!',
        description: `Welcome, ${displayName}! Let's set up your store.`,
      });

      // The redirect is now handled by the AppLayout component
      return true;
    } catch (error: any) {
      console.error("Signup failed:", error);
      if (error.code === 'permission-denied' || error.name === 'FirebaseError') {
            const contextualError = new FirestorePermissionError({
                path: `users/<new_user_uid>`,
                operation: 'create',
                requestResourceData: { email: data.email, role: 'user' /* other fields */ }
            });
            errorEmitter.emit('permission-error', contextualError);
      } else {
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
