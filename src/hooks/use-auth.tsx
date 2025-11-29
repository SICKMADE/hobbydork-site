'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, limit } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useAuth as useFirebaseAuth, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { placeholderImages } from '@/lib/placeholder-images';

interface SignupData {
  email: string;
  password: string;
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
      // Successful login will trigger onAuthStateChanged, which will load the profile and redirect if needed.
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
    const { email, password } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }

    try {
        // Check if this is the first user to determine admin role
        const usersCollectionRef = collection(firestore, "users");
        const q = query(usersCollectionRef, limit(1));
        
        const querySnapshot = await getDocs(q).catch(error => {
            // This is the point of failure. We emit a contextual error here.
            const contextualError = new FirestorePermissionError({
                path: usersCollectionRef.path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', contextualError);
            // We must re-throw the original error to stop execution.
            throw error;
        });

        const isFirstUser = querySnapshot.empty;

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        const userProfileData = {
            uid: newUser.uid,
            email: newUser.email!,
            displayName: newUser.email!,
            avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
            status: 'ACTIVE',
            role: isFirstUser ? 'admin' : 'user',
            emailVerified: true, // No verification step
            notificationPreferences: {
                notifyMessages: true,
                notifyOrders: true,
                notifyISO24: true,
                notifySpotlight: true,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const newUserDocRef = doc(firestore, "users", newUser.uid);
        
        await setDoc(newUserDocRef, userProfileData).catch(error => {
            const contextualError = new FirestorePermissionError({
                path: newUserDocRef.path,
                operation: 'create',
                requestResourceData: userProfileData,
            });
            errorEmitter.emit('permission-error', contextualError);
            throw error;
        });

        toast({
            title: 'Account Created!',
            description: `Welcome! Let's get your store set up.`,
        });

        return true;

    } catch (error: any) {
        // This catch block handles errors from createUserWithEmailAndPassword or the re-thrown Firestore errors
        if (!error.message.includes('permission-error')) { // Avoid double-toasting
            toast({
                title: 'Signup Failed',
                description: error.message || 'An unexpected error occurred during signup.',
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
