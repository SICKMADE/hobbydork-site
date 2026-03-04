'use client';

import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, ArrowRight, Target, Sparkles, Clock, Gavel, MessageSquare, Trophy, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-20 max-w-6xl">
        <header className="max-w-4xl mx-auto text-center space-y-8 mb-32">
          <Badge variant="outline" className="px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest">
            About hobbydork
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-8xl font-headline font-black tracking-tighter uppercase leading-none">
            Built for <span className="text-accent">Collectors.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto italic">
            "A safe, transparent marketplace designed to fix the issues of modern auction sites."
          </p>
        </header>

        <section className="grid lg:grid-cols-2 gap-20 items-center mb-40">
          <div className="space-y-10">
            <h2 className="text-4xl font-headline font-black uppercase tracking-tight border-l-8 border-accent pl-8">
              Our Mission
            </h2>
            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed font-medium">
              <p>
                hobbydork started with a simple idea: collectors deserve a platform that prioritizes authenticity, fast shipping, and community trust over corporate profits.
              </p>
              <p>
                We built a community where sellers are held accountable with enforced 2-business-day shipping standards. Where every payment is secured via Stripe integration. Where performance-based seller tiers reward honest dealers with lower fees. No scams, no fakes, no slow shipping. Just the items you love, delivered fast.
              </p>
              <p className="font-bold text-accent">
                We're different because we actually enforce standards. Ship late? Buyers can cancel and you're penalized. It's that simple.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border bg-zinc-950 flex items-center justify-center p-12">
            <img
              src="/landing.png"
              alt="Hobbydork Community"
              className="object-contain w-full h-full opacity-80"
            />
          </div>
        </section>

        <section className="space-y-20 mb-40">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-headline font-black uppercase tracking-tighter">Core Values</h2>
            <div className="w-24 h-2 bg-accent mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { 
                icon: Clock, 
                title: "Fast Shipping", 
                desc: "Sellers must ship within 2 business days or buyers can cancel. We enforce this with automatic penalties and tier demotions. No excuses, no delays." 
              },
              { 
                icon: ShieldCheck, 
                title: "Transparency", 
                desc: "Every seller's on-time shipping rate is publicly displayed. Performance metrics are tracked daily. Reviews are permanent and linked to real transactions." 
              },
              { 
                icon: Trophy, 
                title: "Performance-Driven", 
                desc: "Seller tiers and fees are based on shipping speed and customer satisfaction. Fast, reliable sellers pay lower fees (5-7%). Slow sellers pay more (10-12%)." 
              },
              { 
                icon: Users, 
                title: "Community", 
                desc: "ISO24 request feed, live community chat, giveaways, auctions, and Trust Board leaderboards. We're building connections, not just transactions." 
              },
            ].map((p, i) => (
              <Card key={i} className="p-10 rounded-2xl hover:shadow-xl transition-all group">
                <CardContent className="p-0 space-y-8">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <p.icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-headline font-black uppercase text-primary">{p.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{p.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-40 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-headline font-black uppercase tracking-tighter">What Makes Us Different</h2>
            <div className="w-24 h-2 bg-accent mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-8 border-2">
                          <CardContent className="p-0 space-y-4">
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-6 h-6 text-accent" />
                              <h3 className="text-xl font-black uppercase">Lowest Seller Fees</h3>
                            </div>
                            <p className="text-muted-foreground">Hobbydork charges some of the lowest seller fees in the industry—just 5-7% for top performers, and never more than 12%. That means more money in your pocket with every sale. No hidden charges, no surprise deductions, and you always see your fee rate up front.</p>
                          </CardContent>
                        </Card>

                        <Card className="p-8 border-2">
                          <CardContent className="p-0 space-y-4">
                            <div className="flex items-center gap-3">
                              <Users className="w-6 h-6 text-accent" />
                              <h3 className="text-xl font-black uppercase">Social Store Feeds</h3>
                            </div>
                            <p className="text-muted-foreground">Every store on Hobbydork has its own social feed. Sellers can post updates, showcase new arrivals, share behind-the-scenes content, and interact with their followers. Buyers can comment, like, and stay connected—making every store a true community hub, not just a storefront.</p>
                          </CardContent>
                        </Card>
            <Card className="p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Gavel className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">Live Auctions</h3>
                </div>
                <p className="text-muted-foreground">Real-time bidding on rare items. Place your bids, get instant notifications when you're outbid, and win the collectibles you want. Transparent, fair, and fast.</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">ISO24 Request Feed</h3>
                </div>
                <p className="text-muted-foreground">Can't find what you're looking for? Post an "In Search Of" request and let sellers come to you. Save time hunting and connect directly with dealers who have your item.</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">Seller Giveaways</h3>
                </div>
                <p className="text-muted-foreground">Sellers reward their communities with free item giveaways. Enter to win, build relationships with dealers, and discover new stores. Winners are randomly selected when giveaways end.</p>
              </CardContent>
            </Card>

            <Card className="p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">Trust Board Rankings</h3>
                </div>
                <p className="text-muted-foreground">Real-time seller leaderboard ranked by sales volume, shipping performance, and customer ratings. Find the most reliable dealers and see transparent performance metrics before you buy.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground rounded-[2rem] p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
          <h2 className="text-4xl md:text-7xl font-headline font-black uppercase tracking-tighter leading-none">
            Ready to <br className="hidden md:block" /> start <span className="text-accent">trading?</span>
          </h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 h-20 px-12 text-2xl font-black rounded-xl shadow-2xl active:scale-95 transition-all uppercase tracking-tighter">
              <Link href="/onboarding">Join the Community <ArrowRight className="ml-3 w-6 h-6" /></Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
