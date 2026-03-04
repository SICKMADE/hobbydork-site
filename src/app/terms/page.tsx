import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tight text-primary">Terms of Service</h1>
        <Card className="p-6 space-y-5">
          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground">By accessing hobbydork, you agree to these Terms, the Seller Agreement, the Privacy Policy, and the Fee Structure disclosures. If you do not agree, do not use the platform.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">2. Platform Type and Scope</h2>
            <p className="text-sm text-muted-foreground">hobbydork is a peer-to-peer collectibles marketplace for categories such as sports cards, comics, watches, and related hobby inventory. Listings may be fixed-price or auction listings. hobbydork facilitates discovery, checkout, and order enforcement, but item ownership and listing accuracy remain the seller's responsibility.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">3. Eligibility and Accounts</h2>
            <p className="text-sm text-muted-foreground">You must be legally able to enter contracts and provide accurate account information. You are responsible for account security and all activity under your account.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">4. Order Flow and Checkout</h2>
            <p className="text-sm text-muted-foreground">Checkout is processed through Stripe. Auction listings may only be completed by eligible winning bidders. Fixed-price listings may be purchased through Buy It Now when in stock and active.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">5. Shipping Enforcement (Material Term)</h2>
            <p className="text-sm text-muted-foreground">Seller shipment performance is a core platform requirement. Paid orders must be received by carrier within 2 business days (excluding weekends and federal holidays). Carrier acceptance scan is required; label creation alone does not satisfy compliance.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">6. Prohibited Conduct</h2>
            <p className="text-sm text-muted-foreground">Counterfeit goods, stolen property, fraud, abuse, and unlawful content are prohibited and may result in immediate suspension or termination.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">7. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground">The service is provided "AS IS" and "AS AVAILABLE." To the maximum extent permitted by law, hobbydork disclaims implied warranties and limits liability for indirect or consequential damages.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">8. Governing Law</h2>
            <p className="text-sm text-muted-foreground">These Terms are governed by Nevada law, with exclusive venue in Clark County, Nevada, unless otherwise required by law.</p>
          </section>

          <p className="text-xs text-muted-foreground pt-2 border-t">This page is informational only and not legal advice. Have counsel review before launch.</p>
        </Card>
      </main>
    </div>
  );
}
