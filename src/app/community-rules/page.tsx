
'use client';

import AppLayout from '@/components/layout/AppLayout';

export default function CommunityRulesPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <h1 className="text-3xl font-bold">HobbyDork Community &amp; Content Rules</h1>

        <section className="space-y-3 text-sm leading-relaxed">
          <p>
            These rules apply everywhere in HobbyDork: Listings, Stores, ISO24,
            messages, and community chat.
          </p>

          <h2 className="text-xl font-semibold">1. Be respectful</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No harassment, threats, or personal attacks.</li>
            <li>No hate speech or slurs.</li>
            <li>No doxxing or sharing private personal information.</li>
          </ul>

          <h2 className="text-xl font-semibold">2. No scams or shady behavior</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No fake listings or bait-and-switch.</li>
            <li>
              No pressuring people into &quot;Friends &amp; Family&quot; or risky
              off-platform payments.
            </li>
            <li>No chargeback scams or intentionally failing to ship items.</li>
            <li>No impersonating other users, stores, or admins.</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Content rules</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>No illegal items or content.</li>
            <li>No counterfeit or clearly misrepresented items.</li>
            <li>No pornographic content or extreme gore.</li>
            <li>No spam, mass advertising, or irrelevant self-promotion.</li>
            <li>No malicious links, phishing, or malware.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Use Goods &amp; Services</h2>
          <p>
            To reduce scam risk, HobbyDork expects transactions to use Goods
            &amp; Services (PayPal G&amp;S, etc.) whenever possible. If someone
            pressures you into risky payment methods, you can refuse and report
            them.
          </p>

          <h2 className="text-xl font-semibold">
            5. ISO24 and chat behavior
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keep ISO24 posts focused on what you&apos;re actually looking for.</li>
            <li>Don&apos;t spam the same ISO or message repeatedly.</li>
            <li>
              Use chat to talk hobby, deals, and collecting — not to harass or run
              drama campaigns.
            </li>
          </ul>

          <h2 className="text-xl font-semibold">6. Enforcement</h2>
          <p>
            Admins and Moderators may delete content, issue warnings, suspend accounts,
            or permanently ban users. Access to posting, selling, or messaging can be
            limited if needed to protect the community.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
