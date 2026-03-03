import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

export default function SellerAgreementPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tight text-primary">Seller Agreement</h1>
        <Card className="p-6 space-y-5">
          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">1. Seller Commitments</h2>
            <p className="text-sm text-muted-foreground">Sellers must list only authentic, legally sellable collectibles and provide complete, accurate listing data including title, category, condition, images, and known defects.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">2. Mandatory 2-Day Shipping</h2>
            <p className="text-sm text-muted-foreground">All paid orders must be received by carrier within 2 business days (weekends and federal holidays excluded). A carrier acceptance scan is required. Label creation or pickup scheduling alone does not satisfy this requirement.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">3. Late Shipment Enforcement</h2>
            <p className="text-sm text-muted-foreground">Late shipment events may trigger automatic buyer cancellation eligibility, full refund execution, tier downgrade, higher effective seller fees, and moderation actions. Sellers acknowledge this no-tolerance enforcement model at onboarding and while listing.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">4. Condition and Grading Representations</h2>
            <p className="text-sm text-muted-foreground">Raw items must be represented as raw and may not be implied as gem-grade. Graded items must include accurate grading company and grade details. Any claim that could influence a buyer seeking PSA 10/CGC 9.8 style outcomes must be factual and supported.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">5. Listing Types and Fulfillment</h2>
            <p className="text-sm text-muted-foreground">For auction listings, sellers must honor winning outcomes and fulfill paid orders. For fixed-price listings, sellers must honor posted price and available quantity when checkout succeeds.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-black uppercase">6. Violations and Remedies</h2>
            <p className="text-sm text-muted-foreground">hobbydork may remove listings, reduce visibility, suspend selling privileges, suspend accounts, and apply additional moderation remedies for violations or patterns of risk.</p>
          </section>

          <p className="text-xs text-muted-foreground pt-2 border-t">This page is informational only and not legal advice. Have counsel review before launch.</p>
        </Card>
      </main>
    </div>
  );
}
