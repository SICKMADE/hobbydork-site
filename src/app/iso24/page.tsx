'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  PlusCircle, 
  MessageCircle, 
  Clock, 
  Loader2, 
  Search as SearchIcon, 
  CheckCircle2,
  ShieldAlert,
  Scan,
  ChevronRight,
  Activity,
  Terminal,
  Radio,
  Zap,
  Cpu
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { CATEGORIES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Import tactical font protocols
import '../digital-time.css';
import '../iso24-header.css';
import '../iso24-title.css';

function CountdownTimer({ postedAt }: { postedAt: any }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const postedTime = postedAt?.toDate ? postedAt.toDate().getTime() : new Date(postedAt).getTime();
      const expiresAt = postedTime + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [postedAt]);

  return <span className="font-mono text-accent animate-pulse">{timeLeft}</span>;
}

export default function ISO24Feed() {
  const router = useRouter();
  const { toast } = useToast();
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
      const isRecent = postedAtTime > oneDayAgo && item.status !== 'Found';
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return isRecent && matchesCategory;
    });
  }, [isoItems, selectedCategory]);

  const handleMarkFound = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'iso24Posts', id), { status: 'Found' });
      toast({ title: "Hunt Concluded", description: "Glad you found your grail!" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Update Failed" });
    }
  };

  const handleContactCollector = (item: any) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Auth Required' });
      router.push('/login');
      return;
    }
    router.push(`/messages?seller=${item.userName}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-4 md:py-6 max-w-6xl">
        
        {/* MASSIVE TACTICAL BANNER (RESTORED AUTHORITY) */}
        <div className="w-full flex justify-center mb-12">
          <div className="w-full max-w-6xl rounded-none border-4 border-zinc-900 bg-zinc-950 py-16 md:py-24 px-6 md:px-12 relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            
            {/* Layer 1: Tactical Grid Background */}
              <div className="absolute inset-0 opacity-[0.1] pointer-events-none iso24-grid-bg" />
            
            {/* Layer 2: Signal Noise interference */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-noise" />

            {/* Layer 3: Moving Scanlines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 bottom-0 left-1/3 w-[1px] bg-red-600/10 animate-[scanline-h_10s_linear_infinite]" />
              <div className="absolute left-0 right-0 top-1/4 h-[1px] bg-white/5 animate-[scanline-v_5s_linear_infinite]" />
            </div>

            {/* Corner Mechanical Brackets */}
            <div className="absolute top-3 left-3 w-14 h-14 border-t-4 border-l-4 border-red-600/40 pointer-events-none animate-pulse" />
            <div className="absolute top-3 right-3 w-14 h-14 border-t-4 border-r-4 border-red-600/40 pointer-events-none animate-pulse" />
            <div className="absolute bottom-3 left-3 w-14 h-14 border-b-4 border-l-4 border-red-600/40 pointer-events-none animate-pulse" />
            <div className="absolute bottom-3 right-3 w-14 h-14 border-b-4 border-r-4 border-red-600/40 pointer-events-none animate-pulse" />

            {/* UNIFIED SINGLE-LINE SIGNATURE (MASSIVE SCALE & GLOW) */}
            <div className="relative z-10 flex flex-row flex-nowrap items-center justify-center gap-x-4 md:gap-x-8 lg:gap-x-12 w-full select-none overflow-hidden whitespace-nowrap">
              
              {/* WORD: IN */}
              <h2 className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">
                IN
              </h2>

              {/* WORD: SEARCH (GLITCHING) */}
              <div className="relative">
                <h2 className="text-red-600 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none animate-glitch-text absolute inset-0 opacity-50 translate-x-1">
                  SEARCH
                </h2>
                <h2 className="text-red-600 text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none relative z-10 drop-shadow-[0_0_30px_rgba(220,38,38,0.7)]">
                  SEARCH
                </h2>
              </div>

              {/* WORD: OF */}
              <h2 className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black uppercase italic tracking-tighter leading-none drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">
                OF
              </h2>

              {/* CLOCK: : 24 (GARGANTUAN SCALE WITH DIGITAL GLOW) */}
              <div 
                className="text-red-600 text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] leading-none tracking-tighter iso24-clock-glow"
              >
                : 24
              </div>
            </div>

            {/* Bottom Status Ribbon */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/90 backdrop-blur-xl border-t border-red-600/20 z-30 px-10 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Radio className="w-3 h-3 text-red-600 animate-pulse" />
                  <span className="text-[8px] font-black text-red-600 uppercase tracking-[0.25em]">HD_ISO_BROADCAST_v4.5</span>
                </div>
                <div className="hidden sm:block h-3 w-[1px] bg-white/10" />
                <div className="hidden sm:flex items-center gap-2">
                  <Activity className="w-3 h-3 text-zinc-600" />
                  <span className="text-[7px] font-mono text-zinc-600 tracking-tighter uppercase">SIGNAL_STABLE</span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <button title="System Intel" className="text-[8px] font-black text-white/30 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-1 group/intel">
                    PROTOCOL_INTEL <ChevronRight className="w-3 h-3 text-red-600 group-hover/intel:translate-x-1 transition-transform" />
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-none bg-zinc-950 text-white border-zinc-800 p-8 shadow-[0_0_80px_rgba(220,38,38,0.25)]">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-red-600 text-white p-3 rounded-none shadow-xl">
                        <Scan className="w-6 h-6" />
                      </div>
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-headline font-black uppercase italic tracking-tight">ISO24 Protocol</DialogTitle>
                      </DialogHeader>
                    </div>
                    <div className="space-y-4 text-zinc-400 font-medium leading-relaxed italic text-base border-l-4 border-red-600 pl-6">
                      <p>
                        <strong className="text-white">ISO24</strong> is a live 24-hour frequency where collectors broadcast their most urgent needs.
                      </p>
                      <p>
                        Posts are purged automatically after the transmission cycle ends.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 text-red-600 font-black tracking-widest text-[9px] uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              TRANSMISSION_NODE: ACTIVE
            </div>
            <h2 className="text-xl md:text-3xl font-headline font-black uppercase italic tracking-tight text-primary leading-none">ACTIVE TRANSMISSIONS</h2>
          </div>
          <Button asChild className="bg-zinc-900 text-white hover:bg-zinc-800 font-black h-12 px-8 rounded-none shadow-xl uppercase text-[10px] tracking-widest gap-2 transition-all active:scale-95 group/btn shrink-0">
            <Link href="/iso24/create">
              <Zap className="w-3.5 h-3.5 group-hover/btn:scale-125 transition-transform" />
              CREATE ISO POST
            </Link>
          </Button>
        </div>

        {/* Security Warning */}
        
        <div className="mb-8 bg-red-600/5 border-2 border-red-600/20 p-4 rounded-none flex items-start gap-4">
          <div className="bg-red-600/10 p-1.5 rounded-none">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[8px] font-black uppercase text-red-600 tracking-[0.2em] leading-none mb-1">Critical Directive</p>
            <p className="text-xs font-bold text-primary leading-tight">
              OFF-SITE TRANSACTIONS PROHIBITED: To maintain protection protocols, all trades must utilize the hobbydork atomic checkout.
            </p>
          </div>
        </div>

        {/* Categories (Tactical Strip) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-4 mb-8 border-b border-muted">
          <Button 
            variant={selectedCategory === 'All' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "rounded-none h-9 px-5 text-[8px] font-black uppercase tracking-widest shrink-0 transition-all",
              selectedCategory === 'All'
                ? "bg-primary text-white border-primary dark:bg-zinc-800 dark:text-white"
                : "border-2"
            )}
          >
            Global Scanner
          </Button>
          {CATEGORIES.map(cat => (
            <Button 
              key={cat} 
              variant={selectedCategory === cat ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-none h-9 px-5 text-[8px] font-black uppercase tracking-widest shrink-0 transition-all",
                selectedCategory === cat
                  ? "bg-primary text-white border-primary dark:bg-zinc-800 dark:text-white"
                  : "border-2"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Feed Grid */}
        <div className="grid gap-4 md:gap-6">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="animate-spin w-10 h-10 mx-auto text-accent" /></div>
          ) : activeHunts.length === 0 ? (
            <Card className="p-20 text-center border-8 border-dashed rounded-none bg-muted/10">
              <SearchIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase text-xs text-zinc-400 tracking-[0.3em]">NO ACTIVE ISO POSTS DETECTED - CHECK BACK SOON.</p>
            </Card>
          ) : activeHunts.map(item => (
            <Card key={item.id} className="p-6 md:p-8 group shadow-lg hover:shadow-2xl transition-all border-none bg-card rounded-none relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="border-accent text-accent uppercase font-black text-[8px] tracking-[0.15em] px-2.5 py-0.5 bg-accent/5 rounded-none">{item.category}</Badge>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-accent bg-accent/5 px-2.5 py-0.5 rounded-none border border-accent/10">
                      <Clock className="w-3 h-3" /> 
                      PURGE_IN: 
                      <CountdownTimer postedAt={item.postedAt} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-3xl font-headline font-black uppercase italic tracking-tight leading-none text-primary">{item.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed max-w-2xl italic text-sm md:text-base">"{item.description}"</p>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-muted w-fit pr-8">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-none bg-zinc-100 flex items-center justify-center font-black text-[8px] border">@</div>
                      <span className="text-[10px] font-black uppercase text-primary">@{item.userName}</span>
                    </div>
                    <div className="h-3 w-[1px] bg-muted" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Target Budget: <span className="text-primary font-black text-xs">${item.budget?.toLocaleString()}</span></span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-center shrink-0 w-full md:w-auto">
                  {user?.uid === item.uid ? (
                    <Button onClick={() => handleMarkFound(item.id)} className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] h-12 px-8 rounded-none shadow-xl w-full">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark as Found
                    </Button>
                  ) : (
                    <Button onClick={() => handleContactCollector(item)} className="bg-primary text-primary-foreground font-black uppercase text-[10px] h-12 px-8 rounded-none shadow-xl w-full gap-2 active:scale-95 transition-all">
                      <MessageSquare className="w-3.5 h-3.5" /> Open Comms Channel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
