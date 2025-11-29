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
import { doc, serverTimestamp, getDocs, collection, query, writeBatch, limit } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useAuth as useFirebaseAuth, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { placeholderImages } from '@/lib/placeholder-images';

interface SignupData {
  displayName: string;
  email: string;
  password: string;
  storeName: string;
  storeSlug: string;
  storeAbout: string;
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
    const { displayName, email, password, storeName, storeSlug, storeAbout, oneAccountAcknowledged, goodsAndServicesAgreed } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    
    try {
      // Check if any users exist to determine role.
      const usersCollectionRef = collection(firestore, "users");
      const q = query(usersCollectionRef, limit(1));
      const querySnapshot = await getDocs(q);
      const isFirstUser = querySnapshot.empty;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const batch = writeBatch(firestore);

      // 1. Create the Store document
      const newStoreRef = doc(collection(firestore, "storefronts"));
      batch.set(newStoreRef, {
          storeId: newStoreRef.id,
          ownerUid: newUser.uid,
          storeName,
          slug: storeSlug,
          about: storeAbout,
          avatarUrl: placeholderImages['store-logo-1']?.imageUrl || `https://picsum.photos/seed/${storeSlug}/200/200`,
          ratingAverage: 0,
          ratingCount: 0,
          itemsSold: 0,
          status: "ACTIVE",
          isSpotlighted: false, 
          spotlightUntil: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      });
      
      // 2. Create the User profile document
      const userProfileRef = doc(firestore, "users", newUser.uid);
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'uid'> & { createdAt: any, updatedAt: any, uid: string } = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName,
        avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'LIMITED',
        role: isFirstUser ? 'admin' : 'user',
        storeId: newStoreRef.id,
        emailVerified: newUser.emailVerified,
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
      batch.set(userProfileRef, userProfile);

      // Commit the batch
      await batch.commit();
      
      await sendEmailVerification(newUser);
      
      toast({
        title: 'Signup Successful!',
        description: `Welcome, ${displayName}! Your account and store are ready. A verification email has been sent.`,
      });
      return true;

    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'An unexpected error occurred during sign up.',
        variant: 'destructive',
      });
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
