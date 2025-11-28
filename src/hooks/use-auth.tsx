'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface SignupData {
  displayName: string;
  email: string;
  password: string;
  oneAccountAcknowledged: boolean;
  goodsAndServicesAgreed: boolean;
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (data: SignupData) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const auth = getAuth();
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
    const { displayName, email, password, oneAccountAcknowledged, goodsAndServicesAgreed } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const userProfile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName,
        avatar: `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'LIMITED',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        role: 'user',
        emailVerified: newUser.emailVerified,
        oneAccountAcknowledged,
        goodsAndServicesAgreed,
        notificationPreferences: {
          notifyMessages: true,
          notifyOrders: true,
          notifyISO24: true,
          notifySpotlight: true,
        },
      };

      await setDoc(doc(firestore, "users", newUser.uid), userProfile);
      
      await sendEmailVerification(newUser);
      
      toast({
        title: 'Signup Successful!',
        description: `Welcome, ${displayName}! A verification email has been sent to your inbox.`,
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

    