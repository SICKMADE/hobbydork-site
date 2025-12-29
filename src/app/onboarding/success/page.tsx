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
    <div className="flex min-h-screen items-center justify-center text-white">
      Checking seller status…
    </div>
  );
}
