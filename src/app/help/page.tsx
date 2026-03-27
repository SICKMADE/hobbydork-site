'use client';

import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ShieldCheck, 
  HelpCircle, 
  PlusCircle, 
  Clock, 
  Users, 
  AlertTriangle,
  Zap,
  Terminal,
  ShieldAlert,
  Shield,
  Heart
} from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12 space-y-4 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-accent/20">
            <HelpCircle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter">Help Center</h1>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-[0.3em]">[ Central_Intelligence_Hub ]</p>
        </header>

        <div className="grid gap-12">
          {/* VAULT PIN CHALLENGE */}
          <section id="vault-pin" className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic text-accent">
              <Shield className="w-6 h-6 text-accent" /> The Vault Pin Challenge
            </h2>
            <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Unlock exclusive platform rewards by finding the secret 4-digit PIN hidden somewhere on the site. The code could be anywhere&mdash;in a banner, a page, or a hidden message. Once you find it, follow the instructions on the Vault page to enter the code and claim your reward.
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Need a hint? Explore the site carefully and pay attention to details. For questions or help, contact support via the Help Center.
                </p>
              </CardContent>
            </Card>
          </section>
                    {/* FEE STRUCTURE */}
                    <section className="space-y-6">
                      <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic text-primary">
                        <ShieldCheck className="w-6 h-6 text-primary" /> Fee Structure & Payouts
                      </h2>
                      <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
                        <CardContent className="p-6 space-y-6">
                          <div>
                            <h3 className="text-lg font-black uppercase mb-2">Dealer Health Protocols (Tiers)</h3>
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
                            <div className="p-4 bg-red-50 rounded-xl border border-red-100 mt-4">
                              <p className="text-xs text-red-900 font-bold italic">
                                DAMAGE PENALTY: Any violation of the 2-day shipping standard results in an immediate loss of hearts, resetting your node to 1 Heart status and increasing platform fees.
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-black uppercase mb-2">Payment Processing Fees</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                              <li>Card processing: 2.9% + $0.30 per transaction (via Stripe)</li>
                              <li>Processing fees are assessed before seller payout</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-lg font-black uppercase mb-2">Refunds and Chargebacks</h3>
                            <ul className="text-sm text-muted-foreground space-y-2">
                              <li>Late-shipment cancellations trigger full buyer refund eligibility</li>
                              <li>Associated fees may not be recoverable from payment processor</li>
                              <li>Repeated chargebacks can result in enforcement action</li>
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-lg font-black uppercase mb-2">Payout Timing</h3>
                            <p className="text-sm text-muted-foreground">Payouts are issued after payment settlement and any risk/review holds required for fraud prevention or dispute management.</p>
                            <p className="text-xs text-muted-foreground">This section is informational only and not legal advice. Have counsel review before launch.</p>
                          </div>
                        </CardContent>
                      </Card>
                    </section>
          {/* FINDING ITEMS */}
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic">
              <Search className="w-6 h-6 text-accent" /> Discovery Protocols
            </h2>
            <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-to-search" className="border-none">
                    <AccordionTrigger className="font-black uppercase text-sm text-left hover:no-underline hover:text-accent transition-colors">How do I locate specific grails?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm space-y-4 pt-2">
                      <p>Hobbydork utilizes three primary discovery channels:</p>
                      <ul className="space-y-3">
                        <li className="flex gap-3">
                          <div className="w-5 h-5 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0"><Terminal className="w-3 h-3" /></div>
                          <span><strong>Global Archives:</strong> Use the search bar at the top of the node to scan item titles and tags.</span>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0"><Zap className="w-3 h-3" /></div>
                          <span><strong>ISO24 Frequency:</strong> Access the live 24-hour request feed to broadcast your specific needs to the dealer network.</span>
                        </li>
                        <li className="flex gap-3">
                          <div className="w-5 h-5 rounded bg-accent/10 text-accent flex items-center justify-center shrink-0"><Users className="w-3 h-3" /></div>
                          <span><strong>Trust Board:</strong> Locate top-ranked sellers with high shipping velocity via the Dossier system.</span>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* SELLING ITEMS */}
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic">
              <PlusCircle className="w-6 h-6 text-accent" /> Seller Protocols
            </h2>
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-card overflow-hidden">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="identity-lock" className="border-b">
                    <AccordionTrigger className="font-black uppercase text-sm text-left hover:no-underline hover:text-accent transition-colors">Identity Lock: Username vs Store Name</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                      <div className="bg-zinc-950 text-white p-4 rounded-xl border-l-4 border-accent mb-4">
                        <p className="font-bold italic">Your network handle (@username) is your store name. Users cannot choose a separate store name; it is permanently locked to your identity upon registration.</p>
                      </div>
                      <p>This protocol ensures absolute transparency and trust within the collector network. Your URL, handle, and storefront name are one unified node.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="becoming-seller" className="border-b">
                    <AccordionTrigger className="font-black uppercase text-sm text-left hover:no-underline hover:text-accent transition-colors">How do I initiate a seller node?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                      Click "Become Seller" in your dashboard to start the 7-step deployment. You must have a verified email and an active Stripe Connect account to list assets.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="seller-tiers" className="border-none">
                    <AccordionTrigger className="font-black uppercase text-sm text-left hover:no-underline hover:text-accent transition-colors">Performance Health (Hearts) & Fees</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                      <p>Sellers are ranked using a 3-Heart "Life Bar" system based on their shipping speed and volume. Dealers with 3 Hearts (Legendary) enjoy lower platform fees (as low as 4%) and priority discovery status.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* SHIPPING STANDARDS */}
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic text-red-600">
              <Clock className="w-6 h-6 text-red-600" /> Mandatory 48-Hour Protocol
            </h2>
            <Card className="border-none shadow-2xl bg-zinc-950 text-white rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-600 p-3 rounded-2xl shadow-xl shadow-red-600/20">
                    <ShieldAlert className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Zero Tolerance Delivery</h3>
                    <p className="text-sm font-medium text-zinc-400 leading-relaxed italic">
                      Every asset must be <span className="text-white font-black">RECEIVED BY THE CARRIER</span> within 2 business days of payment.
                    </p>
                  </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="shipping-rule" className="border-white/10">
                    <AccordionTrigger className="font-black uppercase text-xs text-left hover:no-underline text-accent">What counts as "Shipped"?</AccordionTrigger>
                    <AccordionContent className="text-zinc-400 leading-relaxed text-sm pt-2 space-y-4">
                      <p>A shipping label creation <span className="text-white font-bold">does not</span> satisfy the protocol. The carrier (USPS/UPS/FedEx) must perform an initial acceptance scan within the 48-hour window.</p>
                      <div className="p-4 border border-white/10 bg-white/5 rounded-xl">
                        <p className="font-black text-red-500 uppercase text-[10px] mb-1">ENFORCEMENT ACTION:</p>
                        <p className="text-xs font-bold italic">Failing to meet this standard grants the buyer a 1-click refund right and triggers an immediate "Damage Penalty" to your dealer health hearts.</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* DISPUTES & SECURITY */}
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3 italic">
              <ShieldCheck className="w-6 h-6 text-accent" /> Security & Escrow
            </h2>
            <Card className="border-none shadow-xl rounded-[2rem] bg-card overflow-hidden">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="escrow" className="border-b">
                    <AccordionTrigger className="font-black uppercase text-sm text-left hover:no-underline hover:text-accent transition-colors">How is my payment secured?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                      All payments are processed via Stripe Connect and held in secure escrow until delivery is verified by the carrier. Hobbydork never sees your raw card data.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="returns" className="border-none">
                    <AccordionTrigger className="font-black uppercase text-sm text-left hover:no-underline hover:text-accent transition-colors">Return Protocols</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm pt-2">
                      Returns are governed by the specific condition represented at the time of sale. Raw items are generally sold "As-Is" unless materially misrepresented. Graded items carry their respective third-party certifications.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* SUPPORT ACTION */}
        <div className="mt-20 p-8 md:p-12 bg-zinc-950 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 hardware-grid-overlay opacity-[0.05]" />
          <div className="relative z-10 space-y-8">
            <div className="space-y-2 text-center">
              <h3 className="text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tighter">System Support</h3>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">Awaiting Authority Command</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-accent text-white hover:bg-accent/90 h-14 px-10 rounded-2xl font-black uppercase text-xs gap-3 shadow-xl shadow-accent/20">
                <Link href="/report-issue">
                  <AlertTriangle className="w-5 h-5" /> Report Integrity Issue
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-14 px-10 rounded-2xl font-black uppercase text-xs gap-3 !text-white !border-white/20 bg-transparent hover:bg-white/5 transition-all">
                <Link href="/legal-hub">
                  <Shield className="w-5 h-5" /> Review Mission Legal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}