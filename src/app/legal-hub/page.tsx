'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Lock, DollarSign, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

const legalDocs = [
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms of Service',
    description: 'Platform policies, eligibility, order flow, and legal framework',
    href: '/terms',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    audience: 'All Users',
  },
  {
    id: 'seller-agreement',
    icon: Users,
    title: 'Seller Agreement',
    description: 'Seller commitments, 2-day shipping requirement, enforcement, and consequences',
    href: '/seller-agreement',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
    audience: 'Sellers',
  },
  {
    id: 'privacy',
    icon: Lock,
    title: 'Privacy Policy',
    description: 'Data collection, usage, third-party processors, and Nevada privacy rights',
    href: '/privacy',
    color: 'bg-green-50 border-green-200',
    iconColor: 'text-green-600',
    audience: 'All Users',
  },
  {
    id: 'fees',
    icon: DollarSign,
    title: 'Fee Structure',
    description: 'Platform fees by tier, payment processing, refunds, and payout timing',
    href: '/fees',
    color: 'bg-purple-50 border-purple-200',
    iconColor: 'text-purple-600',
    audience: 'Sellers & Buyers',
  },
];

export default function LegalHubPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-8 h-8 text-accent mt-1 flex-shrink-0" />
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-primary mb-2">
                Legal & Compliance Hub
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Everything you need to know about hobbydork's policies, commitments, and how we operate
              </p>
            </div>
          </div>
        </div>

        {/* Quick Shield */}
        <div className="mb-12 p-6 bg-accent/10 border-2 border-accent rounded-xl space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 font-black text-xs">✓</div>
            <div>
              <p className="font-black text-accent mb-1">Zero Tolerance 2-Day Shipping Policy</p>
              <p className="text-sm text-muted-foreground">All sellers ship orders within 2 business days (carrier scan required). Late shipments trigger automatic buyer cancellations and seller penalties with no exceptions.</p>
            </div>
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {legalDocs.map((doc) => {
            const IconComponent = doc.icon;
            return (
              <Card
                key={doc.id}
                className={`p-6 border-2 ${doc.color} hover:shadow-lg transition-all group cursor-pointer`}
              >
                <Button
                  asChild
                  variant="ghost"
                  className="h-auto p-0 w-full justify-start"
                >
                  <Link href={doc.href} className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-white border-2 flex items-center justify-center ${doc.iconColor}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs font-bold">
                        {doc.audience}
                      </Badge>
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-primary group-hover:text-accent transition-colors text-left">
                        {doc.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 text-left">
                        {doc.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-accent font-bold text-sm pt-2 group-hover:gap-3 transition-all">
                      Read Full Policy <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Key Policies Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tight text-primary mb-6">
            Key Platform Policies at a Glance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-l-4 border-l-orange-600 space-y-2">
              <p className="font-black uppercase text-sm text-orange-900">Shipping Requirement</p>
              <p className="text-sm text-muted-foreground">
                Orders must be received by USPS/UPS/FedEx within 2 business days. Label creation doesn't count—carrier scan is required.
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-l-blue-600 space-y-2">
              <p className="font-black uppercase text-sm text-blue-900">Raw vs Graded</p>
              <p className="text-sm text-muted-foreground">
                Raw items are sold as-is with no returns based on condition. Graded items include professional certification.
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-l-purple-600 space-y-2">
              <p className="font-black uppercase text-sm text-purple-900">Seller Tiers</p>
              <p className="text-sm text-muted-foreground">
                Tier 1 (8%), Tier 2 (6%), Tier 3 (4%). Late shipments trigger immediate downgrade and higher fees.
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-l-green-600 space-y-2">
              <p className="font-black uppercase text-sm text-green-900">Buyer Cancellation</p>
              <p className="text-sm text-muted-foreground">
                Buyers can cancel with one click if sellers don't ship within 2 business days and receive automatic full refunds.
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-l-red-600 space-y-2">
              <p className="font-black uppercase text-sm text-red-900">Payment Processing</p>
              <p className="text-sm text-muted-foreground">
                All payments processed through Stripe. Seller receives payout after settlement and any risk holds.
              </p>
            </Card>

            <Card className="p-5 border-l-4 border-l-cyan-600 space-y-2">
              <p className="font-black uppercase text-sm text-cyan-900">Moderation</p>
              <p className="text-sm text-muted-foreground">
                Community reporting system with discretionary enforcement. Violations may result in listing removal or account suspension.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="p-8 bg-gradient-to-r from-accent/10 to-accent/5 border-2 border-accent rounded-2xl space-y-4">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-primary mb-2">
              Ready to Buy or Sell?
            </h3>
            <p className="text-muted-foreground mb-4">
              Make sure you've reviewed the policies that apply to you before joining the marketplace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="gap-2 bg-accent hover:bg-accent/90 text-white font-black uppercase">
              <Link href="/seller/onboarding">
                Start Selling
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 font-black uppercase border-2">
              <Link href="/">
                Start Buying
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-muted/30 rounded-xl border border-border text-xs text-muted-foreground space-y-2">
          <p className="font-bold">⚖️ LEGAL DISCLAIMER</p>
          <p>
            These documents are provided for informational purposes and do not constitute legal advice. While we've worked to make them accurate, actual legal documents should be reviewed by licensed attorneys in your jurisdiction before entering into transactions. Laws vary significantly by location. All of hobbydork's policies operate with Nevada law as the governing framework.
          </p>
        </div>
      </main>
    </div>
  );
}
