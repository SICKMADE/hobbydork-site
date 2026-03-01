'use client';

import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, ShieldCheck, HelpCircle, MessageSquare, PlusCircle, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-12 space-y-4 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black uppercase tracking-tighter">Help Center</h1>
          <p className="text-muted-foreground font-medium">Everything you need to know about buying and selling on hobbydork.</p>
        </header>

        <div className="grid gap-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Search className="w-6 h-6 text-accent" /> Finding Items
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-to-search">
                    <AccordionTrigger className="font-bold text-lg text-left">How do I search for specific collectibles?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>There are several ways to find exactly what you're looking for:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Global Search:</strong> Use the search bar at the top of the page. You can search by item name, seller name, or specific keywords like "mint condition" or "signed."</li>
                        <li><strong>Category Browsing:</strong> On the home page, use the category tabs (Watches, Cards, Coins, etc.) to see all active listings in that niche.</li>
                        <li><strong>Requests Feed:</strong> If you can't find an item, visit the Requests Feed (ISO24). You can see what other people are looking for or post your own "In Search Of" request.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="filtering">
                    <AccordionTrigger className="font-bold text-lg text-left">Can I filter my results?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Yes! When you search or browse a category, you can use the filter panel to set price ranges and distinguish between standard listings and auctions. You can also look for top-ranked sellers on the Trust Board.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <PlusCircle className="w-6 h-6 text-accent" /> Selling Items
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="who-can-sell">
                    <AccordionTrigger className="font-bold text-lg text-left">Who is eligible to sell on hobbydork?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>Any registered member who meets the following criteria can become a seller:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Verified Identity:</strong> Your email address must be verified.</li>
                        <li><strong>Stripe Connect:</strong> You must have a supported Stripe account connected to receive payouts safely.</li>
                        <li><strong>Authenticity Guarantee:</strong> You must agree to only list authentic items and provide accurate condition reports.</li>
                        <li><strong>Dealer Standards:</strong> You must commit to shipping items within 2 business days of a verified sale.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="becoming-seller">
                    <AccordionTrigger className="font-bold text-lg text-left">How do I start selling?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Simply click "Become Seller" in the sidebar or your dashboard. You'll complete a quick 5-step onboarding process where you name your shop, choose your specialty niche, and connect your Stripe account for secure processing.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="listing-process">
                    <AccordionTrigger className="font-bold text-lg text-left">How do I create a listing?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Once you are a registered seller, go to "New Listing." You can upload photos or use our "Live Cam" tool. You can set a fixed price (Buy It Now) or start an Auction with a defined end time.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-accent" /> Security & Payments
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="payments">
                    <AccordionTrigger className="font-bold text-lg text-left">Are my payments secure?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Absolutely. hobbydork uses Stripe for all transactions. Funds are held securely until delivery is confirmed, protecting both the collector and the dealer from fraud.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="trust-board">
                    <AccordionTrigger className="font-bold text-lg text-left">What is the Trust Board?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      The Trust Board is our real-time community leaderboard. It ranks sellers based on their verified sales volume and user ratings. It’s the best place to find the most reliable dealers in the community.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-accent" /> Communication
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="messaging">
                    <AccordionTrigger className="font-bold text-lg text-left">How do I talk to a seller?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Every listing has a "Message Seller" button. This opens a secure private chat thread where you can ask questions or request more photos. For your protection, always keep your communication and payments within the platform.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-20 p-10 bg-zinc-950 text-white rounded-[2.5rem] text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-headline font-black uppercase tracking-tighter">Still need help?</h3>
            <p className="text-zinc-400 font-medium italic">Reach out to our team if you encountered a bug or have a suggestion.</p>
          </div>
          <Button asChild className="bg-accent text-white hover:bg-accent/90 h-14 px-8 rounded-xl font-black uppercase tracking-widest gap-2">
            <Link href="/report-issue">
              <AlertTriangle className="w-5 h-5" /> Report an Issue
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
