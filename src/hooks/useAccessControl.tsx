import { useUser } from '@/firebase';
import { useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useAccessControl(db) {
  const { user, isUserLoading } = useUser();
  const profileRef = user && db ? doc(db, 'users', user.uid) : null;
  const { data: profile, isLoading: profileLoading } = useDoc(profileRef);

  const isVerified = user?.emailVerified && profile?.status === 'ACTIVE';
  const isSeller = isVerified && profile?.isSeller;
  const loading = isUserLoading || profileLoading;

  return { user, profile, isVerified, isSeller, loading };
}

export function showAccessDeniedToast(toast, type = 'default') {
  toast({
    variant: 'destructive',
    title: 'Access Denied',
    description: 'You must verify your email and have an active profile to use this feature.',
  });
}

export function withGuard(Component, { requireSeller = false }) {
  return function Guarded(props) {
    const db = ...; // get firestore instance
    const { isVerified, isSeller, loading } = useAccessControl(db);
    const router = useRouter();

    if (loading) return <div>Loading...</div>;
    if (!isVerified) {
      router.push('/verify-email');
      return null;
    }
    if (requireSeller && !isSeller) {
      router.push('/seller/onboarding');
      return null;
    }
    return <Component {...props} />;
  };
}
