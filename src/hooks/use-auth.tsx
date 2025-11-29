'use client';

import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User as FirebaseUser,
  getIdTokenResult
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, limit, updateDoc } from 'firebase/firestore';
import { useUser, useDoc, useFirestore, useAuth as useFirebaseAuth, useMemoFirebase } from '@/firebase';
import type { User as UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { placeholderImages } from '@/lib/placeholder-images';

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
    // This effect runs when the user object changes (e.g., on login, token refresh)
    const handleActivation = async () => {
      if (user && profile?.status === 'LIMITED') {
        // Force a refresh of the ID token to get the latest email_verified status
        const tokenResult = await getIdTokenResult(user, true);
        
        if (tokenResult.claims.email_verified && userProfileRef) {
          // Update the user's status to 'ACTIVE' in Firestore
          await updateDoc(userProfileRef, { 
              status: 'ACTIVE', 
              emailVerified: true, 
              updatedAt: serverTimestamp() 
          });

          toast({
            title: 'Account Activated!',
            description: 'Your account has been fully activated. Welcome!',
          });
          
          // Redirect to onboarding to complete setup
          router.push('/onboarding');
        }
      }
    };
    
    handleActivation().catch((error) => {
        console.error('Error during account activation:', error);
        toast({
          title: 'Activation Failed',
          description: 'Could not update your account status. Please try logging in again or contact support.',
          variant: 'destructive',
        });
    });

  }, [user, profile, userProfileRef, router, toast]);


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
    const { displayName, email, password, oneAccountAcknowledged, goodsAndServicesAgreed } = data;
    if (!firestore) {
        toast({ title: 'Signup Failed', description: 'Database service is not available.', variant: 'destructive' });
        return false;
    }
    
    // Check if any user exists to determine admin role *before* creating the user.
    // This is safe because of the `list` rule with `limit(1)` in firestore.rules.
    const usersCollectionRef = collection(firestore, "users");
    const q = query(usersCollectionRef, limit(1));
    const querySnapshot = await getDocs(q);
    const isFirstUser = querySnapshot.empty;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      const userProfile: Omit<UserProfile, 'createdAt' | 'updatedAt' | 'uid'> & { createdAt: any, updatedAt: any, uid: string } = {
        uid: newUser.uid,
        email: newUser.email!,
        displayName,
        avatar: placeholderImages['user-avatar-1']?.imageUrl || `https://picsum.photos/seed/${newUser.uid}/100/100`,
        status: 'LIMITED',
        role: isFirstUser ? 'admin' : 'user',
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
