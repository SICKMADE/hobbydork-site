'use client';

import { useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function OnboardingSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('No user');

        const token = await user.getIdToken(true);

        const res = await fetch(
          'https://us-central1-studio-4668517724-751eb.cloudfunctions.net/checkStripeSellerStatus',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.isSeller) {
          toast.success('Seller account approved!');
          router.replace('/dashboard');
        } else {
          toast.info('Stripe still reviewing your account');
          router.replace('/onboarding/pending');
        }
      } catch (err) {
        console.error(err);
        toast.error('Stripe verification failed');
      }
    };

    run();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-blue-400">
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl shadow-xl bg-white/80">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <div className="text-lg font-semibold text-blue-900">Checking seller status…</div>
        <div className="text-sm text-muted-foreground text-center max-w-xs">
          Please wait while we verify your Stripe account and seller status.<br />
          This may take a few seconds. You will be redirected automatically.
        </div>
      </div>
    </div>
  );
}
