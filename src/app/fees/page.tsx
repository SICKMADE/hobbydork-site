
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tight text-primary">Fee Structure</h1>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-black uppercase">Seller Platform Fees</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Tier 1: 8% platform fee per completed order</li>
            <li>Tier 2: 6% platform fee per completed order</li>
            <li>Tier 3: 4% platform fee per completed order</li>
          </ul>
          <p className="text-xs text-muted-foreground">Tier placement depends on seller performance factors, including shipping compliance. Late-shipment behavior can trigger tier downgrades and higher effective costs.</p>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-black uppercase">Payment Processing Fees</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Card processing: 2.9% + $0.30 per transaction (via Stripe)</li>
            <li>Processing fees are assessed before seller payout</li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-black uppercase">Refunds and Chargebacks</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Late-shipment cancellations trigger full buyer refund eligibility</li>
            <li>Associated fees may not be recoverable from payment processor</li>
            <li>Repeated chargebacks can result in enforcement action</li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-black uppercase">Listing Type Notes</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Fixed-price sales settle at listed Buy It Now price.</li>
            <li>Auction sales settle at winning bid amount after checkout.</li>
            <li>Applicable platform and processing fees apply to both listing types.</li>
          </ul>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-black uppercase">Payout Timing</h2>
          <p className="text-sm text-muted-foreground">Payouts are issued after payment settlement and any risk/review holds required for fraud prevention or dispute management.</p>
          <p className="text-xs text-muted-foreground">This page is informational only and not legal advice. Have counsel review before launch.</p>
        </Card>
      </main>
    </div>
  );
}
