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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    // Check if the user is logged in, their email is verified, and their profile is currently 'LIMITED'
    // This logic is now mostly legacy but kept minimal. The primary driver for onboarding is the AppLayout check.
    if (user && user.emailVerified && profile?.status === 'LIMITED' && userProfileRef) {
      // Update the user's status to 'ACTIVE' in Firestore
      const updateData = { status: 'ACTIVE', emailVerified: true, updatedAt: serverTimestamp() };
      setDoc(userProfileRef, updateData, { merge: true })
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
            requestResourceData: updateData,
          });
          errorEmitter.emit('permission-error', contextualError);
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
    
    // We create the user in auth first, which signs them in.
    // The security rules can then use their auth.uid to secure the profile creation.
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'uid' | 'storeId' | 'displayName'> & { createdAt: any, updatedAt: any, uid: string } = {
        uid: newUser.uid,
        email: newUser.email!,
        avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'ACTIVE', // No 'LIMITED' status, user is active immediately for onboarding.
        role: 'user', // All new users are 'user'
        emailVerified: true, // Skipping email verification as requested
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
      await setDoc(newUserRef, userProfile);
      
      toast({
        title: 'Account Created!',
        description: `Welcome! Let's get your store set up.`,
      });
      // IMPORTANT: The redirect to onboarding is now handled by the AppLayout component
      // which checks if the profile is missing a storeId.
      return true;
    } catch (error: any) {
      console.error("Signup failed:", error);
      // Check for permission errors specifically during the setDoc call
      if (error.code === 'permission-denied' || (error.name === 'FirebaseError' && error.message.includes('permission-denied'))) {
            const contextualError = new FirestorePermissionError({
                path: `users/${auth.currentUser?.uid || '<new-user-id>'}`,
                operation: 'create',
                requestResourceData: { email: data.email, role: 'user' }
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
