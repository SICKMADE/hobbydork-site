import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tight text-primary">Privacy Policy</h1>
        <Card className="p-6 space-y-5">
          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">1. Information Collected</h2>
            <p className="text-sm text-muted-foreground">We collect account/profile data, listing and order metadata, shipping/tracking events, moderation reports, device signals, and usage analytics needed to operate a collectibles marketplace and reduce fraud/abuse.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">2. How We Use Data</h2>
            <p className="text-sm text-muted-foreground">Data is used to power listing discovery, checkout/order workflows, shipping compliance enforcement (including late-shipment cancellation eligibility), seller tier calculation, moderation review, and platform reliability.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">3. Third-Party Processors</h2>
            <p className="text-sm text-muted-foreground">We use third-party providers such as Stripe (payments), Firebase (infrastructure/data), and analytics providers. Provider processing is governed by their terms and privacy documentation in addition to ours.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">4. Data Retention and Security</h2>
            <p className="text-sm text-muted-foreground">We retain data according to operational, legal, accounting, and anti-fraud needs (including dispute/audit records). We apply reasonable technical and administrative safeguards, but no online system can be guaranteed completely secure.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">5. Nevada Privacy Rights</h2>
            <p className="text-sm text-muted-foreground">Nevada residents may request not to have covered personal information sold to third parties. Submit privacy requests through platform support channels.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">6. Condition and Transaction Evidence</h2>
            <p className="text-sm text-muted-foreground">Listing photos, descriptions, grading fields, and message history may be used as evidence for condition-related reviews and transaction disputes to support fair marketplace outcomes.</p>
          </section>

          <p className="text-xs text-muted-foreground pt-2 border-t">This page is informational only and not legal advice. Have counsel review before launch.</p>
        </Card>
      </main>
    </div>
  );
}
