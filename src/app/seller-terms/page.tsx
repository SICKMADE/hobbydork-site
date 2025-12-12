
'use client';

import AppLayout from '@/components/layout/AppLayout';

export default function SellerTermsPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <h1 className="text-3xl font-bold">HobbyDork Seller Terms</h1>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            These terms apply in addition to the main HobbyDork Terms of Service when
            you create a Store or list items for sale.
          </p>

          <h2 className="text-xl font-semibold">1. Seller eligibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old.</li>
            <li>Your account must be in good standing.</li>
            <li>You must complete Store setup truthfully.</li>
            <li>
              You agree to use safe payment methods (for example, Goods &amp;
              Services).
            </li>
          </ul>

          <h2 className="text-xl font-semibold">2. Accurate listings</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Use accurate titles, descriptions, and photos for your listings.
            </li>
            <li>Disclose major defects, restoration, or condition issues.</li>
            <li>Set clear prices and don&apos;t change the deal mid-transaction.</li>
            <li>Mark items as sold or inactive when they are no longer available.</li>
          </ul>

          <h2 className="text-xl font-semibold">
            3. Payments and shipping
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Payments are made directly to you using the payment methods you show
              (PayPal G&amp;S, Venmo, etc.).
            </li>
            <li>
              You are responsible for any processor fees, chargebacks, and tax
              obligations.
            </li>
            <li>
              You must not require risky payment methods (for example, Friends &amp;
              Family to avoid fees).
            </li>
            <li>Ship items promptly and provide tracking where possible.</li>
          </ul>

          <h2 className="text-xl font-semibold">
            4. Prohibited selling behavior
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Selling counterfeit or illegal items.</li>
            <li>Misrepresenting grades, signatures, or authenticity.</li>
            <li>Running illegal raffles or gambling.</li>
            <li>Taking payment and intentionally failing to ship.</li>
            <li>
              Using multiple accounts to manipulate trust or get around bans.
            </li>
          </ul>

          <h2 className="text-xl font-semibold">
            5. Disputes with buyers
          </h2>
          <p>
            HobbyDork is not a party to your transaction and does not resolve payment
            disputes, chargebacks, or shipping issues. Work directly with the buyer to
            resolve problems and use Goods &amp; Services plus tracking to protect
            both sides.
          </p>

          <h2 className="text-xl font-semibold">
            6. Loss of seller status
          </h2>
          <p>
            We may suspend or revoke your ability to sell if we receive credible
            reports of fraud, you repeatedly break platform rules, you refuse to
            follow payment safety expectations, or we determine it is necessary for
            the safety of the community.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
