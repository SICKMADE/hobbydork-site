'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, serverTimestamp, runTransaction, collection } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useAuth as useFirebaseAuth, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { placeholderImages } from '@/lib/placeholder-images';


export interface SignupData {
  email: string;
  password: string;
  storeName: string;
  slug: string;
  about: string;
  paymentMethod: "PAYPAL" | "VENMO";
  paymentIdentifier: string;
  agreeGoodsAndServices: boolean;
  agreeOneAccount: boolean;
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
    const { email, password, storeName, slug, about, paymentMethod, paymentIdentifier, agreeGoodsAndServices, agreeOneAccount } = data;
    if (!firestore || !auth) {
        toast({ title: 'Signup Failed', description: 'Authentication service is not available.', variant: 'destructive' });
        return false;
    }

    try {
        // Step 1: Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Step 2: Run a transaction to create the user profile and the store
        await runTransaction(firestore, async (transaction) => {
            const newStoreRef = doc(collection(firestore, "storefronts"));
            const userProfileRef = doc(firestore, "users", newUser.uid);

            // a. Create the user profile document
            const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
                uid: newUser.uid,
                email: newUser.email!,
                displayName: storeName, // Default user's display name to the store name
                avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
                status: 'ACTIVE',
                role: 'user', 
                emailVerified: true, // No verification step, so default to true
                storeId: newStoreRef.id, // Link user to the new store
                paymentMethod: paymentMethod,
                paymentIdentifier: paymentIdentifier,
                goodsAndServicesAgreed: agreeGoodsAndServices,
                oneAccountAcknowledged: agreeOneAccount,
                notificationPreferences: {
                    notifyMessages: true,
                    notifyOrders: true,
                    notifyISO24: true,
                    notifySpotlight: true,
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            transaction.set(userProfileRef, userProfile);

            // b. Create the store document
            transaction.set(newStoreRef, {
                storeId: newStoreRef.id,
                ownerUid: newUser.uid,
                storeName: storeName,
                slug: slug,
                about: about,
                avatarUrl: placeholderImages['store-logo-1']?.imageUrl || `https://picsum.photos/seed/${slug}/128/128`,
                ratingAverage: 0,
                ratingCount: 0,
                itemsSold: 0,
                status: "ACTIVE",
                isSpotlighted: false,
                spotlightUntil: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
        });

        toast({
            title: 'Account Created!',
            description: "Welcome to VaultVerse! Your store is now live.",
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
