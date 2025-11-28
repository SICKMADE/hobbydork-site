'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
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

  const signup = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const userProfile: UserProfile = {
        id: newUser.uid,
        name,
        email: newUser.email!,
        avatar: `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'LIMITED', // New users start as limited
      };

      await setDoc(doc(firestore, "users", newUser.uid), userProfile);
      
      toast({
        title: 'Signup Successful!',
        description: `Welcome, ${name}! Your account has been created.`,
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
