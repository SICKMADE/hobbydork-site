import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className="text-4xl font-black uppercase tracking-tight text-primary">Fee Structure</h1>

        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-black uppercase flex items-center gap-2">
            Dealer Health Protocols (Tiers)
          </h2>
          <ul className="text-sm text-muted-foreground space-y-4">
            <li className="flex items-center gap-3">
              <div className="flex shrink-0">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
              </div>
              <div>
                <span className="font-black text-primary uppercase">1 HEART STATUS (Base):</span> 
                <span className="ml-2">8% platform fee per completed order. Default node status.</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex shrink-0">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
              </div>
              <div>
                <span className="font-black text-primary uppercase">2 HEARTS STATUS (Veteran):</span> 
                <span className="ml-2">6% platform fee per completed order. Earned through consistent volume.</span>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex shrink-0">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
              </div>
              <div>
                <span className="font-black text-primary uppercase">3 HEARTS STATUS (Legendary):</span> 
                <span className="ml-2">4% platform fee per completed order. The absolute tier for elite dealers.</span>
              </div>
            </li>
          </ul>
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-red-900 font-bold italic">
              DAMAGE PENALTY: Any violation of the 2-day shipping standard results in an immediate loss of hearts, resetting your node to 1 Heart status and increasing platform fees.
            </p>
          </div>
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

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-black uppercase">Payout Timing</h2>
          <p className="text-sm text-muted-foreground">Payouts are issued after payment settlement and any risk/review holds required for fraud prevention or dispute management.</p>
          <p className="text-xs text-muted-foreground">This page is informational only and not legal advice. Have counsel review before launch.</p>
        </Card>
      </main>
    </div>
  );
}
