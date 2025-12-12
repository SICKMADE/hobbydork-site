
'use client';

import AppLayout from '@/components/layout/AppLayout';

export default function PrivacyPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <h1 className="text-3xl font-bold">HobbyDork Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: December 5, 2025
        </p>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">1. Overview</h2>
          <p>
            This Privacy Policy explains how HobbyDork collects, uses, and protects
            information related to your use of our app and website. By using
            HobbyDork, you agree to this Privacy Policy.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            2. Information We Collect
          </h2>
          <h3 className="font-semibold">2.1 Information you provide</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account details: email, display name, profile info</li>
            <li>
              Store details: store name, &quot;about&quot; text, avatar/logo image
            </li>
            <li>
              Listings: titles, descriptions, prices, images, categories, conditions
            </li>
            <li>ISO24 posts: text content, categories, timestamps</li>
            <li>Messages and chat: content you send through HobbyDork</li>
            <li>Reports: content of reports you submit about other users/content</li>
            <li>Settings: notification preferences, watchlist/favorites</li>
          </ul>

          <h3 className="font-semibold">2.2 Information collected automatically</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Device and app information (device type, OS, app version, browser)</li>
            <li>Log data (IP address, timestamps, pages/screens viewed)</li>
            <li>Usage data (features you interact with, clicks, navigation)</li>
          </ul>

          <h3 className="font-semibold">2.3 Third-party services</h3>
          <p>
            HobbyDork uses third-party services like Firebase (Auth, Firestore,
            Storage) and analytics tools. These services may collect certain
            technical data (such as IP address and device identifiers) to provide
            their functionality.
          </p>
          <p>
            We do not store full payment details like credit card numbers. Payments
            happen directly between users via third-party services (PayPal, Venmo,
            etc.).
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account and profile</li>
            <li>Enable listings, ISO24 posts, stores, and community chat</li>
            <li>Display your content to other users</li>
            <li>Enforce our Terms of Service and community rules</li>
            <li>Detect and prevent fraud, spam, and abuse</li>
            <li>Send notifications related to activity on your account</li>
            <li>Improve and debug the app</li>
            <li>Analyze usage to understand and improve features</li>
          </ul>
          <p>
            We may also use aggregated and anonymized data (that does not identify
            you personally) for analytics and product improvement.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">4. How We Share Information</h2>
          <p>We may share information:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              With other users: your display name, profile, listings, stores, ISO24
              posts, and messages are visible as part of app functionality.
            </li>
            <li>
              With service providers: hosting, database, storage, analytics, logging,
              and error monitoring providers that help us run the app.
            </li>
            <li>
              For legal reasons: if required by law or to protect the rights,
              property, or safety of HobbyDork, our users, or others.
            </li>
          </ul>
          <p>We do not sell your personal data to data brokers.</p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">5. Data Retention</h2>
          <p>
            We keep your information as long as needed to provide the app, comply
            with legal obligations, resolve disputes, and enforce our agreements.
          </p>
          <p>
            If you delete your account or request deletion, we will remove or
            anonymize your profile and login access where possible. Some data (for
            example, messages, reports, and certain logs) may be retained where we
            have a legitimate reason or legal requirement to do so.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">6. Security</h2>
          <p>
            We use reasonable technical and organizational measures (secure
            connections, access controls, reputable infrastructure providers) to
            protect your information. No system is 100% secure. You are responsible
            for maintaining the security of your devices and login information.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            7. Your Choices and Rights
          </h2>
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or restrict certain processing of your personal data, or request
            data portability.
          </p>
          <p>
            To exercise these rights, contact us at the email below. We may need to
            verify your identity before acting on your request.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            8. Cookies and Similar Technologies
          </h2>
          <p>
            If we use cookies or similar technologies on the web app, some are
            necessary for login and core functionality. Others may be used for
            preferences, analytics, or performance. You can control cookies through
            your browser settings, but blocking some cookies may limit features.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            9. Children&apos;s Privacy
          </h2>
          <p>
            HobbyDork is intended for adults (18+). We do not knowingly collect
            personal data from children under 18. If we learn that we have collected
            data from a child under 18, we will take steps to delete it.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">
            10. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will
            update the &quot;Last updated&quot; date and may provide in-app notice.
            If you continue using HobbyDork after changes take effect, you agree to
            the updated policy.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or your data, contact us
            at: <span className="font-mono">youremail@example.com</span>
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
