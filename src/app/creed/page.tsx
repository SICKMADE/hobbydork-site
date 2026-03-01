'use client';

import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, ArrowRight, Target, Sparkles } from 'lucide-react';
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
                hobbydork started with a simple idea: collectors deserve a platform that prioritizes authenticity and safety over high fees and corporate growth.
              </p>
              <p>
                We built a community where every seller is reviewed by their peers, and every payment is secured via Stripe integration. No scams, no fakes, just the items you love.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border bg-zinc-950 flex items-center justify-center p-12">
            <div className="text-center space-y-6 opacity-40">
              <Sparkles className="w-24 h-24 text-accent mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white">The hobbydork Community</p>
            </div>
          </div>
        </section>

        <section className="space-y-20 mb-40">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-headline font-black uppercase tracking-tighter">Core Values</h2>
            <div className="w-24 h-2 bg-accent mx-auto rounded-full" />
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                icon: ShieldCheck, 
                title: "Transparency", 
                desc: "Every review on the leaderboard is linked to a verified transaction. We keep the marketplace honest by making feedback permanent and public." 
              },
              { 
                icon: Target, 
                title: "Accuracy", 
                desc: "We provide tools for sellers to accurately describe and photograph their items, ensuring buyers know exactly what they're getting." 
              },
              { 
                icon: Users, 
                title: "Community", 
                desc: "hobbydork is driven by the feedback of its members. We listen to collectors to build the features that actually matter." 
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
