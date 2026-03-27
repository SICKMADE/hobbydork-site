'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, ArrowRight, Target, Sparkles, Clock, Gavel, MessageSquare, Trophy, DollarSign, Terminal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AboutPage() {
  // Use image from public/about directory
  const [imgSrc, setImgSrc] = useState<string>('/about/about.jpg');

  // If you want to allow fallback or dynamic logic, you can add it here
  // useEffect(() => {
  //   // Example: setImgSrc('/about/another-image.jpg');
  // }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="container mx-auto px-2 sm:px-4 py-10 sm:py-16 max-w-6xl">
        <header className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 mb-16 sm:mb-32">
          <Badge variant="outline" className="px-4 py-1.5 sm:px-6 sm:py-2 rounded-full font-black text-xs sm:text-sm uppercase tracking-widest">
            About Us
          </Badge>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl md:text-7xl font-headline font-black tracking-tighter uppercase leading-tight sm:leading-none">
            Built for <span className="text-accent">Collectors.</span>
          </h1>
          <p className="text-base xs:text-lg md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-3xl mx-auto italic">
            "A safe, transparent marketplace designed to fix the issues of modern auction sites."
          </p>
        </header>

        <section className="grid gap-10 sm:gap-20 lg:grid-cols-2 items-center mb-24 sm:mb-40">
          <div className="space-y-6 sm:space-y-10">
            <h2 className="text-2xl sm:text-4xl font-headline font-black uppercase tracking-tight border-l-4 sm:border-l-8 border-accent pl-4 sm:pl-8">
              Our Mission
            </h2>
            <div className="space-y-4 text-muted-foreground text-base sm:text-lg leading-relaxed font-medium">
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
          <div className="relative aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl border bg-zinc-950 flex items-center justify-center">
            <Image
              src={imgSrc}
              alt="Hobbydork Community"
              data-ai-hint="vintage cards"
              fill
              className="object-cover opacity-80"
              onError={() => setImgSrc('/about.jpg')}
            />
          </div>
        </section>

        <section className="space-y-12 sm:space-y-20 mb-24 sm:mb-40">
          <div className="text-center space-y-2 sm:space-y-4">
            <h2 className="text-2xl sm:text-4xl font-headline font-black uppercase tracking-tighter">Core Values</h2>
            <div className="w-16 sm:w-24 h-2 bg-accent mx-auto rounded-full" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
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
              <Card key={i} className="p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl hover:shadow-xl transition-all group">
                <CardContent className="p-0 space-y-4 sm:space-y-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-accent/10 text-accent rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <p.icon className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="space-y-2 sm:space-y-4">
                    <h3 className="text-lg sm:text-2xl font-headline font-black uppercase text-primary">{p.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed text-sm sm:text-base">{p.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-24 sm:mb-40 space-y-8 sm:space-y-16">
          <div className="text-center space-y-2 sm:space-y-4">
            <h2 className="text-2xl sm:text-4xl font-headline font-black uppercase tracking-tighter">The hobbydork Advantage</h2>
            <div className="w-16 sm:w-24 h-2 bg-accent mx-auto rounded-full" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-8">
            <Card className="p-5 sm:p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">Lowest Seller Fees</h3>
                </div>
                <p className="text-muted-foreground">Hobbydork charges some of the lowest seller fees in the industry—just 5-7% for top performers, and never more than 12%. That means more money in your pocket with every sale.</p>
              </CardContent>
            </Card>

            <Card className="p-5 sm:p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">Social Store Feeds</h3>
                </div>
                <p className="text-muted-foreground">Every store on Hobbydork has its own social feed. Sellers can post updates, showcase new arrivals, and share behind-the-scenes content.</p>
              </CardContent>
            </Card>
            <Card className="p-5 sm:p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <Gavel className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">Live Auctions</h3>
                </div>
                <p className="text-muted-foreground">Real-time bidding on rare items. Place your bids, get instant outbid notifications, and win the collectibles you want.</p>
              </CardContent>
            </Card>

            <Card className="p-5 sm:p-8 border-2">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-black uppercase">ISO24 Request Feed</h3>
                </div>
                <p className="text-muted-foreground">Post an "In Search Of" request and let sellers come to you. Save time hunting and connect directly with dealers.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-primary dark:bg-zinc-900 rounded-xl sm:rounded-2xl p-4 xs:p-6 sm:p-8 md:p-12 text-center space-y-4 sm:space-y-6 relative overflow-hidden">
          <h2 className="text-base xs:text-lg sm:text-2xl md:text-4xl font-headline font-black uppercase tracking-tighter leading-tight sm:leading-none">
            <span className="text-white">If social media had a baby with a marketplace, you’d get Hobbydork.</span>
          </h2>
          <div className="flex flex-col md:flex-row gap-2 sm:gap-4 justify-center">
            <Button asChild size="lg" className="bg-accent text-white hover:bg-accent/90 h-10 sm:h-14 px-4 sm:px-8 text-base sm:text-lg font-black rounded-md sm:rounded-lg shadow-md sm:shadow-xl active:scale-95 transition-all uppercase tracking-tighter">
              <Link href="/login">Join the Community <ArrowRight className="ml-1 sm:ml-2 w-4 sm:w-5 h-4 sm:h-5" /></Link>
            </Button>
          </div>
        </section>

        <footer className="mt-16 sm:mt-32 pt-8 sm:pt-12 border-t border-border/50 flex flex-col items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-muted-foreground/20 font-black uppercase text-[10px] tracking-[0.5em]">
            <Terminal className="w-3 h-3" /> PROTOCOL_ID: <span className="text-accent/30">2323</span>
          </div>
          <p className="text-[9px] font-black uppercase text-muted-foreground/10 tracking-widest">&copy; {new Date().getFullYear()} hobbydork. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
