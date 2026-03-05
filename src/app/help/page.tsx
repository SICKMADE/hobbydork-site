'use client';

import Navbar from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ShoppingBag, ShieldCheck, HelpCircle, MessageSquare, PlusCircle, AlertTriangle, ArrowRight, UserCheck, Clock, Package, Gavel, Gift, Users, Trophy, Repeat } from 'lucide-react';
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
                  <AccordionItem value="when-to-list">
                    <AccordionTrigger className="font-bold text-lg text-left">When should I list items for sale?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500/30 rounded-lg p-4">
                        <p className="text-red-900 dark:text-red-100 font-bold mb-2">🚨 CRITICAL: Only list items you can ship within 2 business days</p>
                        <p className="text-red-800 dark:text-red-200 font-medium text-sm">
                          If you cannot commit to shipping within 2 business days of receiving payment, DO NOT list the item. This means:
                        </p>
                      </div>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Going on vacation?</strong> Don't list items. Wait until you return.</li>
                        <li><strong>Traveling for work?</strong> Don't list items until you're back home.</li>
                        <li><strong>Item not in hand?</strong> Don't list it until you physically have it ready to ship.</li>
                        <li><strong>Busy schedule?</strong> Only list if you can guarantee a post office trip within 2 business days.</li>
                        <li><strong>Waiting on supplies?</strong> Don't list until you have boxes, tape, and packing materials ready.</li>
                      </ul>
                      <p className="font-bold text-base">Think of each listing as a promise: "I will ship this within 2 business days." If you can't keep that promise, don't list it.</p>
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
              <Clock className="w-6 h-6 text-accent" /> Shipping Standards
            </h2>
            <Card className="border-none shadow-sm bg-gradient-to-r from-red-50 to-accent/5 dark:from-red-950/10 dark:to-accent/5">
              <CardContent className="p-6">
                <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-xl border-2 border-red-500/30">
                  <h3 className="font-black uppercase text-lg mb-2 text-red-900 dark:text-red-100">What Makes HobbyDork Different</h3>
                  <p className="text-sm font-bold text-red-800/80 dark:text-red-200/80 leading-relaxed">
                    We built this marketplace on fast, honest shipping. Unlike other platforms, we enforce strict shipping standards to protect buyers and maintain trust.
                  </p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="48-hour-rule">
                    <AccordionTrigger className="font-bold text-lg text-left">What is the 2 business day shipping rule?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <div className="bg-red-100 dark:bg-red-950/30 border-2 border-red-500 rounded-lg p-4 mb-4">
                        <p className="text-red-900 dark:text-red-100 font-black uppercase text-sm mb-2">⚠️ CRITICAL REQUIREMENT</p>
                        <p className="text-red-800 dark:text-red-200 font-bold text-sm">
                          Your package must be RECEIVED by the carrier (USPS/UPS/FedEx) within 2 business days of payment. Weekends and federal holidays don't count. Just creating a label is NOT enough. If tracking doesn't show carrier acceptance within 2 business days, buyers can cancel and you receive penalties.
                        </p>
                      </div>
                      <p>All sellers must ship orders within 2 business days of payment. This means:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Create shipping label immediately</strong> - Generate tracking and purchase postage</li>
                        <li><strong>Drop off at carrier within 2 business days</strong> - Package must scan as "received" by USPS/UPS/FedEx</li>
                        <li><strong>Weekends & holidays excluded</strong> - If a sale happens Friday evening, you have until Tuesday (Mon/Tue = 2 business days)</li>
                        <li><strong>Tracking must update</strong> - Status must change from "Label Created" to "In Transit" or "Received by Carrier"</li>
                      </ul>
                      <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-4">Example: Order placed Saturday → Monday (day 1) → Tuesday (day 2) = must be received by carrier by end of Tuesday</p>
                      <p className="text-red-600 dark:text-red-400 font-black text-base mt-4">⚠️ IF YOUR PACKAGE IS NOT RECEIVED BY THE CARRIER WITHIN 2 BUSINESS DAYS, BUYERS CAN CANCEL FOR AN AUTOMATIC FULL REFUND. YOU WILL BE PENALIZED.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="buyer-protection">
                    <AccordionTrigger className="font-bold text-lg text-left">What if my seller doesn't ship?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p className="font-bold text-lg">Buyers are fully protected with one-click cancellation:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>After 2 business days with no tracking update</strong> - If the package isn't scanned as "received by carrier" within 2 business days (excluding weekends/holidays), you can cancel and get an instant refund. No waiting, no negotiation.</li>
                        <li><strong>Label created but not shipped</strong> - If tracking shows only "Label Created" for 2+ business days with no carrier acceptance scan, you can cancel immediately.</li>
                        <li><strong>Full refund guarantee</strong> - All cancellations for late shipping result in complete, automatic refunds processed through Stripe within 3-5 business days.</li>
                        <li><strong>Seller is penalized</strong> - Late shipments count against the seller's performance, lower their tier, increase their fees, and damage their public reputation.</li>
                      </ul>
                      <p className="text-green-600 dark:text-green-400 font-bold mt-4">You're in control. If a seller doesn't ship fast, cancel and find someone who will.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="seller-penalties">
                    <AccordionTrigger className="font-bold text-lg text-left">What happens to sellers who ship late?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>Late shipping has real consequences:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Tier Demotion</strong> - On-time shipping rate affects your seller tier (Bronze/Silver/Gold/Platinum)</li>
                        <li><strong>Higher Fees</strong> - Lower tiers pay higher seller fees (Bronze: 12%, Silver: 10%, Gold: 7%, Platinum: 5%)</li>
                        <li><strong>Visible Metrics</strong> - Your on-time shipping rate is displayed on your store page for all buyers to see</li>
                        <li><strong>Late Shipment Count</strong> - Tracked over 30 and 60 day periods and displayed in your dashboard</li>
                      </ul>
                      <p className="text-green-600 dark:text-green-400 font-bold">Sellers with 0 late shipments in 30 days earn a "Fast Shipper" badge!</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tier-requirements">
                    <AccordionTrigger className="font-bold text-lg text-left">What are the tier requirements?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>To qualify for higher tiers, you need excellent shipping performance:</p>
                      <ul className="list-disc pl-6 space-y-3">
                        <li><strong>Platinum:</strong> 100+ completed orders, ≥97% on-time rate, ≤1 late shipment in 30 days (5% fee)</li>
                        <li><strong>Gold:</strong> 100+ completed orders, ≥97% on-time rate, ≤1 late shipment in 30 days (7% fee)</li>
                        <li><strong>Silver:</strong> 20+ completed orders, ≥90% on-time rate, ≤5 late shipments in 30 days (10% fee)</li>
                        <li><strong>Bronze:</strong> Default tier for new sellers (12% fee)</li>
                      </ul>
                      <p>Your tier is automatically calculated daily based on your shipping performance.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Gavel className="w-6 h-6 text-accent" /> Auctions
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-auctions-work">
                    <AccordionTrigger className="font-bold text-lg text-left">How do auctions work?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>Sellers can create auctions with a starting price and duration. Buyers place bids in real-time and receive notifications when outbid or when they win.</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Place a Bid:</strong> Submit your offer - must be higher than current highest bid</li>
                        <li><strong>Get Notifications:</strong> You'll be alerted if outbid or when the auction ends</li>
                        <li><strong>Win & Pay:</strong> Highest bidder at auction end must complete purchase within 24 hours</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="bidding-rules">
                    <AccordionTrigger className="font-bold text-lg text-left">What are the bidding rules?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Bid Increments:</strong> Each bid must be higher than the current highest bid</li>
                        <li><strong>Binding Commitment:</strong> Placing a bid is a commitment to purchase if you win</li>
                        <li><strong>No Sniping Protection:</strong> If a bid is placed in the final minutes, the auction may extend by 2 minutes</li>
                        <li><strong>Winner Pays:</strong> Winning bidder must complete purchase via Stripe checkout within 24 hours</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Gift className="w-6 h-6 text-accent" /> Giveaways
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="what-are-giveaways">
                    <AccordionTrigger className="font-bold text-lg text-left">What are giveaways?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>Giveaways allow sellers to randomly reward their community with free items. It's a great way to:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Build your following and store reputation</li>
                        <li>Generate excitement around new inventory</li>
                        <li>Thank loyal customers</li>
                        <li>Attract new buyers to your store</li>
                      </ul>
                      <p>Enter giveaways by visiting a seller's store page and clicking "Enter Giveaway." Winners are randomly selected when the giveaway ends.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="creating-giveaways">
                    <AccordionTrigger className="font-bold text-lg text-left">How do I create a giveaway?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Verified sellers can create giveaways from their dashboard. Upload photos of the prize, set a duration (1-30 days), and announce it in the community chat to maximize entries. The winner is automatically selected and notified when the giveaway ends.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Search className="w-6 h-6 text-accent" /> ISO24 Request Feed
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="what-is-iso24">
                    <AccordionTrigger className="font-bold text-lg text-left">What is ISO24?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>ISO24 stands for "In Search Of - 24 Hours." It's a community request feed where buyers can post what they're looking for:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Post Requests:</strong> Describe the item you're hunting for with photos and details</li>
                        <li><strong>Get Notified:</strong> Sellers can reply with "I have this!" and you'll receive instant notifications</li>
                        <li><strong>Connect Directly:</strong> Message sellers who respond to negotiate price and finalize the deal</li>
                        <li><strong>Save Time:</strong> Instead of searching endlessly, let sellers come to you</li>
                      </ul>
                      <p>Perfect for rare items, specific variants, or when you know exactly what you want but can't find it in active listings.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="post-iso-request">
                    <AccordionTrigger className="font-bold text-lg text-left">How do I post an ISO request?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Visit the ISO24 page from the sidebar, click "New Request," and describe what you're looking for. Add photos if you have them (reference images help sellers identify exactly what you want). Your request stays active and sellers in the community can respond when they have matching items.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Users className="w-6 h-6 text-accent" /> Community Features
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="community-chat">
                    <AccordionTrigger className="font-bold text-lg text-left">What is the Community Chat?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      The Community Chat is a real-time chatroom where collectors and dealers can discuss items, share knowledge, announce new listings, and build relationships. It's moderated to keep conversations respectful and on-topic. Great for getting quick opinions, price checks, or finding fellow enthusiasts in your niche.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="trust-board-detail">
                    <AccordionTrigger className="font-bold text-lg text-left">How does the Trust Board ranking work?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>The Trust Board ranks sellers based on real performance metrics:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Total Sales Volume:</strong> Number of completed transactions</li>
                        <li><strong>On-Time Shipping Rate:</strong> Percentage of orders shipped within 2 business days</li>
                        <li><strong>Customer Ratings:</strong> Average review score from buyers</li>
                        <li><strong>Account Age:</strong> How long they've been a verified seller</li>
                      </ul>
                      <p>Rankings update daily. Top sellers get special badges and higher visibility in search results.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="store-themes">
                    <AccordionTrigger className="font-bold text-lg text-left">Can sellers customize their stores?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      Yes! Sellers can personalize their storefronts with custom themes including Comic Book, Neon Syndicate, Urban, and Hobby Shop styles. Upload custom banners, avatars, and write a bio describing your collection specialty. Make your store stand out and reflect your brand.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Repeat className="w-6 h-6 text-accent" /> Orders, Returns & Refunds
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="order-process">
                    <AccordionTrigger className="font-bold text-lg text-left">How does the order process work?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <ol className="list-decimal pl-6 space-y-2">
                        <li><strong>Purchase:</strong> Complete checkout via Stripe (funds held in escrow)</li>
                        <li><strong>Seller Ships:</strong> Seller has 2 business days to ship and upload tracking</li>
                        <li><strong>In Transit:</strong> Track your package in real-time from your Orders page</li>
                        <li><strong>Delivered:</strong> Confirm receipt or report issues within 3 days</li>
                        <li><strong>Funds Released:</strong> Seller receives payout after delivery confirmation</li>
                      </ol>
                      <p>You can message the seller at any point during this process.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="returns-policy">
                    <AccordionTrigger className="font-bold text-lg text-left">What is the return policy?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>Returns are accepted for:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Item Not as Described:</strong> Condition significantly different from listing</li>
                        <li><strong>Damaged in Transit:</strong> Item arrived broken or damaged</li>
                        <li><strong>Wrong Item:</strong> Received something different than ordered</li>
                        <li><strong>Authenticity Issues:</strong> Item is not authentic when listed as genuine</li>
                      </ul>
                      <p>Initiate returns from your Orders page within 3 days of delivery. Buyer ships item back, seller confirms receipt, and full refund is processed.</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="disputes">
                    <AccordionTrigger className="font-bold text-lg text-left">What if there's a dispute?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                      If you can't resolve an issue with the seller directly, escalate to our moderation team via the "Report Issue" button. Provide photos and details. Our team reviews all evidence and makes a binding decision. HobbyDork holds funds until disputes are resolved, protecting both parties.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="seller-fees">
                    <AccordionTrigger className="font-bold text-lg text-left">What fees do sellers pay?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-base space-y-4">
                      <p>Seller fees are tier-based and performance-driven:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Bronze (12%):</strong> Default tier for new sellers</li>
                        <li><strong>Silver (10%):</strong> 20+ sales, ≥90% on-time shipping</li>
                        <li><strong>Gold (7%):</strong> 100+ sales, ≥97% on-time shipping</li>
                        <li><strong>Platinum (5%):</strong> Elite tier with exceptional performance</li>
                      </ul>
                      <p>Ship fast consistently to lower your fees. Promotional periods (first 30 days) may offer 0% fees for qualifying sellers.</p>
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

          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-black uppercase flex items-center gap-3">
              <Clock className="w-6 h-6 text-accent" /> Shipping Policy
            </h2>
            <Card className="border-none shadow-sm bg-orange-50 border-2 border-orange-200">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="2day-policy">
                    <AccordionTrigger className="font-bold text-lg text-left text-orange-900">What is the 2-Day Shipping Policy?</AccordionTrigger>
                    <AccordionContent className="text-orange-900 leading-relaxed text-base space-y-4">
                      <p className="font-bold">⚠️ ALL SELLERS MUST FOLLOW THIS POLICY WITH ZERO TOLERANCE</p>
                      <p>Every item sold on hobbydork must be <strong>received by carrier (USPS, UPS, or FedEx)</strong> within 2 business days of payment. Weekends and federal holidays do not count toward this window.</p>
                      <div className="bg-white/70 p-4 rounded-lg border border-orange-300">
                        <p className="font-bold mb-2">❌ WHAT DOESN'T COUNT:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Printing a shipping label</li>
                          <li>Getting a pickup scheduled</li>
                          <li>Dropping at mailbox later in the day</li>
                        </ul>
                      </div>
                      <div className="bg-white/70 p-4 rounded-lg border border-orange-300">
                        <p className="font-bold mb-2">✅ WHAT COUNTS:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Package scanned by USPS/UPS/FedEx</li>
                          <li>Carrier tracking shows acceptance</li>
                          <li>Receipt from carrier with timestamp</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="late-shipping-consequences">
                    <AccordionTrigger className="font-bold text-lg text-left text-orange-900">What happens if a seller ships late?</AccordionTrigger>
                    <AccordionContent className="text-orange-900 leading-relaxed text-base space-y-3">
                      <p><strong>Automatic buyer cancellation:</strong> If the seller hasn't provided carrier acceptance within 2 business days, buyers can cancel with one click and receive a full refund automatically.</p>
                      <p><strong>Seller penalties (no tolerance):</strong></p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Tier downgrade (loss of fee reductions)</li>
                        <li>Higher seller fees on all future listings</li>
                        <li>Public reputation damage (visible to all buyers)</li>
                        <li>Potential suspension after repeated violations</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="buyer-right-to-cancel">
                    <AccordionTrigger className="font-bold text-lg text-left text-orange-900">As a buyer, can I cancel if the seller is late?</AccordionTrigger>
                    <AccordionContent className="text-orange-900 leading-relaxed text-base">
                      Yes. If after 2 business days you don't see carrier acceptance on your tracking, a red "Late Shipping - You Can Cancel" banner will appear on your order page. Click "Cancel Order & Get Full Refund" and you'll receive instant reimbursement. The seller will be penalized for the late shipment.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>
        <div className="mt-20 p-10 bg-zinc-950 text-white rounded-[2.5rem] space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-headline font-black uppercase tracking-tighter">Still need help?</h3>
            <p className="text-zinc-400 font-medium italic">Reach out to our team if you encountered a bug or have a suggestion.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-accent text-white hover:bg-accent/90 h-12 px-8 rounded-xl font-black uppercase tracking-widest gap-2">
              <Link href="/report-issue">
                <AlertTriangle className="w-5 h-5" /> Report an Issue
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest gap-2 border-white hover:bg-white/10">
              <Link href="/legal-hub">
                📚 Legal & Policies
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
