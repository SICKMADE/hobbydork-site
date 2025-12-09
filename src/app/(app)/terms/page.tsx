'use client';

import AppLayout from '@/components/layout/AppLayout';

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
            HobbyDork is a platform that helps collectors connect to buy, sell, and
            talk about collectibles (comics, cards, and other hobby items). We
            provide user accounts, listings for items, ISO24 posts, storefronts for
            sellers, and community chat/messaging.
          </p>
          <p>
            HobbyDork is <strong>not</strong> a payments processor and never holds
            your money. All payments are handled directly between buyers and sellers
            using their chosen payment methods (for example, PayPal Goods &amp;
            Services or Venmo).
          </p>
          <p>
            By creating an account or using HobbyDork, you agree to these Terms.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">2. Who Can Use HobbyDork</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must be at least 18 years old.</li>
            <li>You must be able to enter into a binding contract in your region.</li>
            <li>You must follow all applicable laws where you live.</li>
            <li>
              You may have only <strong>one account per person</strong>. Duplicate
              or fake accounts may be suspended or permanently banned.
            </li>
          </ul>
          <p>
            If we believe you have violated these rules, we can suspend or terminate
            your account at our discretion.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            3. Your Account and Security
          </h2>
          <p>You are responsible for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keeping your login details secure</li>
            <li>All activity that occurs under your account</li>
            <li>Using accurate, honest information in your profile and listings</li>
          </ul>
          <p>
            If you think someone else has accessed your account, contact us and
            change your password immediately.
          </p>
          <p>
            We may suspend, limit, or terminate your account (temporarily or
            permanently) if you violate these Terms, our policies, or we suspect
            fraud, scams, or abusive behavior, or we need to protect other users or
            the platform.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            4. Roles: Users, Sellers, Admins, Moderators
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Users</strong>: Can browse, search, use ISO24, message,
              participate in community chat, and buy items from Sellers.
            </li>
            <li>
              <strong>Sellers</strong>: Users who have created a Store and been
              approved to list items for sale. Sellers must follow the Seller Terms.
            </li>
            <li>
              <strong>Admins</strong>: Can manage the platform, including
              suspending/banning users, removing content, managing spotlight, and
              handling reports.
            </li>
            <li>
              <strong>Moderators</strong> (if assigned): May help enforce rules
              (removing content, warning users, recommending suspensions) but do not
              handle payments.
            </li>
          </ul>
          <p>
            Admins and Moderators can remove or restrict content and accounts at
            their discretion to protect the platform and users.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            5. Listings, ISO24 Posts, and Stores
          </h2>
          <p>
            When you post a Listing, ISO24 post, or content in your Store, you
            agree that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>All information must be accurate, honest, and not misleading.</li>
            <li>
              You will clearly describe the item, its condition, and any defects.
            </li>
            <li>
              You will not list counterfeit, illegal, or prohibited items, or use
              HobbyDork for fraud or money laundering.
            </li>
          </ul>
          <p>HobbyDork may hide or remove content and adjust how it is displayed.</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            6. Payments and Transactions
          </h2>
          <p>
            HobbyDork does not process payments and does not hold funds. All
            payments occur directly between buyers and sellers using third-party
            services (for example, PayPal Goods &amp; Services or Venmo).
          </p>
          <p>
            HobbyDork is not a party to the payment transaction and is not
            responsible for chargebacks, failed payments, fraud, or disputes between
            buyers and sellers.
          </p>
          <p>
            You understand that you are dealing directly with other users at your
            own risk and that HobbyDork is not liable for non-delivery, damaged
            items, or misrepresented items except where required by law.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            7. Community Behavior and Content
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Harass, threaten, or abuse any user</li>
            <li>Use hate speech, slurs, or targeted harassment</li>
            <li>Post illegal content or promote illegal activity</li>
            <li>Post spam, scams, phishing, or malicious links</li>
            <li>Post NSFW, pornographic, or extremely graphic content</li>
            <li>Impersonate another person, brand, or admin</li>
          </ul>
          <p>
            Admins/moderators may remove messages, posts, and listings, and suspend
            or ban users to keep the platform safe.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            8. Reporting and Enforcement
          </h2>
          <p>
            You may report users, Listings, ISO24 posts, Stores, or messages that
            you believe violate these Terms. Reports may be reviewed by admins and
            moderators. We are not obligated to act on every report but use them to
            keep the platform safe.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            9. Spotlight, Promotions, and Store Features
          </h2>
          <p>
            HobbyDork may offer store spotlight positions, special layouts, boosts,
            or other promotional placements. Some may be free; others may be paid.
          </p>
          <p>
            Spotlight or promotional placement is not guaranteed and may be revoked
            if a store or user violates rules or we change how the platform works.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            10. Intellectual Property
          </h2>
          <p>
            You retain ownership of the content you post, but by posting on
            HobbyDork you grant us a non-exclusive, worldwide, royalty-free license
            to use and display that content within the platform.
          </p>
          <p>
            You must only upload content you have the rights to use. HobbyDork
            branding and logos are owned by us and may not be used without
            permission.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            11. Disclaimer of Warranties
          </h2>
          <p>
            HobbyDork is provided &quot;as is&quot; and &quot;as available&quot;
            without any warranties, express or implied. We do not guarantee that
            Listings are accurate, that users will complete transactions, or that
            the platform will be uninterrupted or error-free.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            12. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, HobbyDork and its owners,
            admins, and staff are not liable for any indirect, incidental, special,
            or consequential damages arising from your use of the platform.
          </p>
          <p>
            Our total liability for any claim related to your use of HobbyDork is
            limited to the amount you have paid directly to us (if any) in the 3
            months prior to the claim.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            13. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. When we do, we will change
            the &quot;Last updated&quot; date and may provide in-app notice. If you
            continue using HobbyDork after changes take effect, you agree to the
            updated Terms.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">14. Contact</h2>
          <p>
            If you have questions about these Terms, reports, or account issues,
            contact us at: <span className="font-mono">youremail@example.com</span>
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
