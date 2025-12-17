'use client';

import AppLayout from '@/components/layout/AppLayout';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <h1 className="text-3xl font-bold">HobbyDork Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: December 5, 2025
        </p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">1. What HobbyDork Is</h2>
          <p>
            HobbyDork is a marketplace platform that allows collectors to buy and
            sell items through verified sellers using secure, integrated checkout.
          </p>
          <p>
            HobbyDork uses <strong>Stripe</strong> to process payments. HobbyDork
            does not store payment credentials and never directly handles card data.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">2. Eligibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old</li>
            <li>You must provide accurate account information</li>
            <li>One account per person</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">3. Payments</h2>
          <p>
            All purchases on HobbyDork are processed through Stripe Checkout.
          </p>
          <p>
            Sellers receive payouts through Stripe Connect. HobbyDork is not
            responsible for delays caused by Stripe verification or banking issues.
          </p>
          <p>
            Chargebacks, refunds, and disputes are handled according to Stripe’s
            policies.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">4. Seller Responsibilities</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Accurate listings</li>
            <li>Timely shipping</li>
            <li>Compliance with applicable laws</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">5. Platform Enforcement</h2>
          <p>
            HobbyDork may suspend or terminate accounts that violate policies,
            attempt off-platform payments, or abuse the system.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">6. Disclaimer</h2>
          <p>
            HobbyDork is provided “as-is”. We are not responsible for user-generated
            content or seller behavior.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">7. Contact</h2>
          <p>
            Questions? Contact <span className="font-mono">hobbydorkowner@gmail.com</span>
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
