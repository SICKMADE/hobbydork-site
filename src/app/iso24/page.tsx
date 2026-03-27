'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  Clock, 
  Loader2, 
  Scan, 
  ChevronRight,
  Activity,
  Radio,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import '../digital-time.css';

export default function ISO24Feed() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const isoQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'iso24Posts'), orderBy('postedAt', 'desc'), limit(100));
  }, [db]);

  const { data: isoItems, isLoading: loading } = useCollection(isoQuery);

  const activeHunts = useMemo(() => {
    if (!isoItems) return [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return isoItems.filter(item => {
      const postedAtTime = item.postedAt?.toDate ? item.postedAt.toDate().getTime() : new Date(item.postedAt).getTime();
      return postedAtTime > oneDayAgo && item.status !== 'Found' && (selectedCategory === 'All' || item.category === selectedCategory);
    });
  }, [isoItems, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* ISO24 HUD BANNER - COMPACT ALARM CLOCK */}
      <header className="py-0 mb-4">
        <div className="max-w-5xl mx-auto bg-zinc-950 rounded-b-2xl py-6 md:py-10 px-2 sm:px-4 md:px-8 relative overflow-hidden shadow-2xl group border-b-2 border-red-600/20">
          <div className="absolute inset-0 opacity-[0.08] hardware-grid-overlay pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 bottom-0 left-1/4 w-[1px] bg-red-600/20 animate-pulse" />
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5" />
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-600 shadow-[0_0_20px_red] animate-scanline opacity-50" />
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-red-600/40 pointer-events-none" />
          <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-red-600/40 pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-red-600/40 pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-red-600/40 pointer-events-none" />

          {/* HUD MAIN CONTENT - ALL IN A LINE */}
          <div className="relative z-10 flex flex-row items-center justify-center gap-x-1 sm:gap-x-3 md:gap-x-6 w-full flex-wrap md:flex-nowrap">
            <h2 className="text-white text-xl sm:text-2xl md:text-5xl font-headline font-black uppercase italic tracking-tighter opacity-90 leading-none">IN</h2>
            <h2 className="text-red-600 text-2xl sm:text-3xl md:text-8xl font-headline font-black uppercase italic tracking-tighter drop-shadow-[0_0_25px_rgba(220,38,38,0.5)] leading-none">SEARCH</h2>
            <h2 className="text-white text-xl sm:text-2xl md:text-5xl font-headline font-black uppercase italic tracking-tighter opacity-90 leading-none">OF</h2>
            <div className="digital-time text-red-600 text-3xl sm:text-5xl md:text-8xl font-black leading-none tracking-tighter iso24-clock-throb shrink-0">
              :24
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/90 border-t border-red-600/20 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Radio className="w-3 h-3 text-red-600 animate-pulse" />
                <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">LIVE_FEED</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="w-3 h-3 text-green-500 animate-pulse" />
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">SECURE_NODE_ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 md:gap-8 mb-8 md:mb-16">
          <div className="space-y-1 md:space-y-2 text-left">
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-headline font-black uppercase italic tracking-tighter leading-none text-primary">Active Hunts</h2>
            <p className="text-muted-foreground font-black uppercase text-[9px] sm:text-[10px] tracking-[0.2em] ml-1">Live collector search requests</p>
          </div>
          <Button asChild className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-xl md:rounded-2xl font-black uppercase text-xs tracking-widest gap-2 sm:gap-3 shadow-xl active:scale-95 transition-all border-2 border-zinc-800 dark:border-white">
            <Link href="/iso24/create"><PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" /> Post Your Search</Link>
          </Button>
        </div>

        <div className="grid gap-8">
          {loading ? (
            <div className="py-24 text-center space-y-4">
              <Loader2 className="animate-spin w-12 h-12 mx-auto text-accent" />
              <p className="font-black uppercase tracking-[0.3em] text-[10px] text-muted-foreground">Scanning Uplink...</p>
            </div>
          ) : activeHunts.length === 0 ? (
            <Card className="p-24 text-center border-4 border-dashed rounded-[3rem] bg-zinc-50/50">
              <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Target className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="font-black uppercase text-sm text-zinc-400 tracking-[0.3em] italic">No active searches in the network.</p>
            </Card>
          ) : activeHunts.map(item => (
            <Card key={item.id} className="p-8 md:p-12 rounded-[3rem] shadow-xl border-none bg-card hover:scale-[1.005] transition-all duration-500 ring-1 ring-black/5 group overflow-hidden relative text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col md:flex-row justify-between gap-10 relative z-10">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <Badge className="bg-accent text-white uppercase text-[9px] font-black px-4 py-1.5 tracking-widest italic shadow-lg">{item.category}</Badge>
                    <span className="text-[9px] font-black text-red-600 uppercase flex items-center gap-1.5"><Clock className="w-4 h-4" /> EXPIRES SOON</span>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tight leading-none group-hover:text-accent transition-colors max-w-full overflow-hidden text-ellipsis whitespace-nowrap sm:whitespace-normal">{item.title}</h3>
                  <p className="text-muted-foreground font-medium italic text-xl md:text-2xl leading-relaxed max-w-3xl border-l-[6px] border-zinc-100 dark:border-zinc-800 pl-8 max-w-full overflow-hidden text-ellipsis whitespace-nowrap sm:whitespace-normal">"{item.description}"</p>
                  <div className="pt-8 border-t border-dashed flex flex-wrap items-center gap-8 text-[11px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-3 bg-muted/50 px-5 py-1.5 rounded-full border">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] shadow-lg">{(item.userName || 'C')?.[0]}</div>
                      <span className="text-primary font-black max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">@{item.userName}</span>
                    </div>
                    <span className="text-accent bg-accent/5 px-5 py-2.5 rounded-xl border-2 border-dashed border-accent/20 text-lg italic font-black">Budget: ${item.budget?.toLocaleString()}</span>
                  </div>
                </div>
                <Button onClick={() => router.push(`/messages?seller=${item.userName}`)} className="h-20 px-12 rounded-2xl bg-zinc-950 text-white font-black uppercase text-xs tracking-widest shadow-2xl shrink-0 active:scale-95 group-hover:bg-accent transition-all">
                  Contact Collector <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
