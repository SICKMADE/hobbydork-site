
'use client';

import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/components/dashboard/Dashboard';
import LandingPage from '@/components/landing/LandingPage';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { logout, profile, loading: isProfileLoading } = useAuth();

  if (isUserLoading || isProfileLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (profile && profile.status === 'SUSPENDED') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Account Suspended</h1>
        <p>Your account has been suspended. Please contact <a href="mailto:hobbydorkapp@gmail.com" className="underline text-primary">support</a> for assistance.</p>
        <Button onClick={() => logout()} variant="destructive">
          Logout
        </Button>
      </div>
    );
  }

  // Map user to required User type if present
  let dashboardUser = null;
  if (user) {
    dashboardUser = {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? null,
      status: profile?.status ?? 'ACTIVE',
      createdAt: profile?.createdAt ?? { toDate: () => new Date() },
      updatedAt: profile?.updatedAt ?? { toDate: () => new Date() },
      role: profile?.role ?? '',
      isSeller: profile?.isSeller ?? false,
      storeId: profile?.storeId ?? undefined,
      paymentMethod: profile?.paymentMethod ?? null,
      paymentIdentifier: profile?.paymentIdentifier ?? null,
      emailVerified: user.emailVerified ?? false,
      oneAccountAcknowledged: profile?.oneAccountAcknowledged ?? false,
      stripeTermsAgreed: profile?.stripeTermsAgreed ?? false,
      notifyMessages: profile?.notifyMessages ?? false,
      notifyOrders: profile?.notifyOrders ?? false,
      notifyISO24: profile?.notifyISO24 ?? false,
      notifySpotlight: profile?.notifySpotlight ?? false,
      blockedUsers: profile?.blockedUsers ?? [],
      stripeAccountId: profile?.stripeAccountId ?? null,
      shippingAddress: profile?.shippingAddress ?? undefined,
      sellerTier: profile?.sellerTier === 'BRONZE' ? 'BRONZE' as 'BRONZE' : profile?.sellerTier === 'SILVER' ? 'SILVER' as 'SILVER' : profile?.sellerTier === 'GOLD' ? 'GOLD' as 'GOLD' : undefined,
      onTimeShippingRate: typeof profile?.onTimeShippingRate === 'number' ? profile.onTimeShippingRate : undefined,
      completedOrders: typeof profile?.completedOrders === 'number' ? profile.completedOrders : undefined,
      disputesLast30d: typeof profile?.disputesLast30d === 'number' ? profile.disputesLast30d : undefined,
      disputesLast60d: typeof profile?.disputesLast60d === 'number' ? profile.disputesLast60d : undefined,
      lateShipmentsLast30d: typeof profile?.lateShipmentsLast30d === 'number' ? profile.lateShipmentsLast30d : undefined,
      lateShipmentsLast60d: typeof profile?.lateShipmentsLast60d === 'number' ? profile.lateShipmentsLast60d : undefined,
      lastTierChange: (profile?.lastTierChange && typeof profile.lastTierChange === 'object' && typeof (profile.lastTierChange as { toDate?: unknown }).toDate === 'function' && typeof (profile.lastTierChange as { seconds?: unknown }).seconds === 'number' && typeof (profile.lastTierChange as { nanoseconds?: unknown }).nanoseconds === 'number') ? profile.lastTierChange as import('firebase/firestore').Timestamp : undefined,
    };
  }
  return (
    <AppLayout>
      <Dashboard user={dashboardUser} profile={profile} />
    </AppLayout>
  );
}
