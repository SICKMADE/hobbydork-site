'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Twitter, 
  Facebook, 
  Instagram,
  Link as LinkIcon, 
  Loader2, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  Sparkles,
  Gift,
  Clock,
  ShieldCheck,
  Search,
  Target,
  ChevronRight,
  Activity
} from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, addDoc, serverTimestamp, getDocs, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ViralBountyPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isCheckingEntry, setIsCheckingEntry] = useState(true);

  const bountyQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'platformBounties'), 
      where('status', '==', 'LIVE'), 
      orderBy('endsAt', 'asc'),
      limit(1)
    );
  }, [db]);

  const { data: bounties, isLoading: bountyLoading } = useCollection(bountyQuery);
  const activeBounty = bounties?.[0];

  useEffect(() => {
    const checkEntry = async () => {
      if (!user || !db || !activeBounty) {
        setIsCheckingEntry(false);
        return;
      }
      try {
        const entriesRef = collection(db, 'platformBountyEntries');
        const q = query(
          entriesRef, 
          where('uid', '==', user.uid), 
          where('bountyId', '==', activeBounty.id), 
          limit(1)
        );
        const snap = await getDocs(q);
        setHasEntered(!snap.empty);
      } catch (e) {
        console.error("Entry verification failed:", e);
      } finally {
        setIsCheckingEntry(false);
      }
    };
    checkEntry();
  }, [user, db, activeBounty]);

  const handleShare = async (platform: string) => {
    if (!user || !activeBounty || !db) {
      toast({ variant: 'destructive', title: "Action Denied", description: "Sign in to join the giveaway." });
      return;
    }

    const shareUrl = "https://hobbydork.com";
    const shareText = `Check out hobbydork, the best marketplace for collectors! Join me in the community. 🚀 #hobbydork #collectors #${activeBounty.title.replace(/\s+/g, '')}`;

    let url = "";
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied!", description: "Paste it in your Instagram bio or story to enter!" });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied!", description: "Share it with your friends to enter." });
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }

    if (!hasEntered) {
      setIsSharing(true);
      const entryData = {
        uid: user.uid,
        username: user.displayName || 'Collector',
        bountyId: activeBounty.id,
        bountyTitle: activeBounty.title,
        platform,
        timestamp: serverTimestamp()
      };

      addDoc(collection(db, 'platformBountyEntries'), entryData)
        .then(() => {
          setHasEntered(true);
          toast({ title: "Entry Confirmed!", description: "You have been entered into the giveaway." });
        })
        .catch(() => {
          toast({ variant: 'destructive', title: "Entry Failed", description: "Something went wrong. Please try again." });
        })
        .finally(() => {
          setIsSharing(false);
        });
    }
  };

  const steps = [
    "Share our URL",
    "Get your entry",
    "Wait for the draw",
    "Win the prize"
  ];

  const bountyPlaceholder = PlaceHolderImages.find(img => img.id === 'default-listing')?.imageUrl || '/defaultbroken.jpg';

  if (bountyLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Loading Giveaway...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 max-w-6xl">
        
        {/* COMPACT HEADER - MATCHES BROWSE SIZE */}
        <header className="py-0 mb-12">
          <div className="max-w-5xl mx-auto bounty-header-bg rounded-b-2xl p-6 md:p-10 shadow-2xl text-white relative overflow-hidden border-b-2 border-accent/20">
            <div className="relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-2 rounded-lg border border-accent/20">
                        <Trophy className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent">Platform Prize Drop</p>
                </div>
                <h1 className="text-3xl md:text-6xl font-headline font-black tracking-tighter uppercase leading-[0.9] mt-4">
                    The Big <span className="text-accent">Bounty</span>
                </h1>
                <p className="text-zinc-400 text-sm md:text-base font-medium mt-2">Win high-value collectibles just for sharing the platform with friends.</p>
            </div>
          </div>
        </header>

        {/* SIMPLE STEPS BAR */}
        <div className="max-w-5xl mx-auto px-4 mb-12">
          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row items-stretch">
            {steps.map((step, i) => (
              <div key={i} className="flex-1 flex items-center p-6 gap-4 relative group">
                <div className="w-12 h-12 rounded-full bg-white border-4 border-accent shadow-[0_0_16px_4px_rgba(0,255,65,0.25)] flex items-center justify-center font-arcade text-2xl text-accent neon-glow select-none">
                  {i + 1}
                </div>
                <p className="text-xs font-black uppercase tracking-tight text-white">
                  {step}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-6 bottom-6 w-[1px] bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {!activeBounty ? (
            <div className="col-span-full py-32 text-center bg-muted/20 rounded-[3rem] border-4 border-dashed border-zinc-200 space-y-4">
              <Search className="w-16 h-16 text-zinc-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-2xl font-headline font-black uppercase italic">Checking for Prizes...</h3>
                <p className="text-muted-foreground font-medium">We'll have a new giveaway for you very soon.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-10">
                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-card">
                  <div className="relative aspect-video w-full bg-zinc-900 border-b-4 border-zinc-950">
                    <Image 
                      src={activeBounty.imageUrl || bountyPlaceholder} 
                      alt={activeBounty.title} 
                      fill 
                      className="object-cover opacity-90"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-red-600 text-white border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest shadow-xl">
                        Featured Prize
                      </Badge>
                    </div>

                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-accent font-black uppercase text-[9px] tracking-widest mb-1">
                          <Target className="w-3.5 h-3.5" /> High Value Asset
                        </div>
                        <h2 className="text-3xl md:text-5xl font-headline font-black text-white leading-none uppercase italic tracking-tighter">
                          {activeBounty.title}
                        </h2>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-8 md:p-12 space-y-10">
                    <div className="space-y-4">
                      <h3 className="text-lg md:text-xl font-headline font-black uppercase flex items-center gap-3 text-primary">
                        <Trophy className="w-6 h-6 text-accent" /> Prize Details
                      </h3>
                      <p className="text-muted-foreground font-medium leading-relaxed text-base md:text-lg italic border-l-4 border-accent/20 pl-6">
                        "{activeBounty.description}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-zinc-50 border-2 border-zinc-100 flex items-center gap-4 shadow-sm">
                        <Clock className="w-8 h-8 text-zinc-400" />
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Draw Date</p>
                          <p className="text-lg font-black uppercase">
                            {activeBounty.endsAt?.toDate ? activeBounty.endsAt.toDate().toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-accent/5 border-2 border-accent/10 flex items-center gap-4 shadow-sm">
                        <Gift className="w-8 h-8 text-accent" />
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase text-accent tracking-widest">Draw Status</p>
                          <p className="text-lg font-black uppercase text-accent">Active</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className="space-y-6">
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-zinc-950 text-white p-8 md:p-10 overflow-hidden relative flex flex-col min-h-[500px]">
                  <div className="absolute inset-0 hardware-grid-overlay opacity-[0.05]" />
                  
                  <div className="relative z-10 flex-1 flex flex-col">
                    {isCheckingEntry ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin text-accent" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Checking entry...</p>
                      </div>
                    ) : hasEntered ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-500 blur-[40px] opacity-20" />
                          <div className="relative w-24 h-24 bg-green-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-2xl md:text-3xl font-headline font-black uppercase italic">Entry Secured</h3>
                          <p className="text-zinc-400 font-bold uppercase text-[9px]">ID: HB_{user?.uid.substring(0,8).toUpperCase()}</p>
                        </div>
                        <p className="text-xs text-zinc-300 font-medium italic leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10">
                          You're in! We'll notify the winner through the platform messages once the draw is complete. Good luck!
                        </p>
                        <div className="pt-6 border-t border-white/10 w-full space-y-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Share Again</p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10 rounded-lg border-white/10 bg-white/5 text-white font-black uppercase text-[9px]" onClick={() => handleShare('twitter')}>
                              <Twitter className="w-3.5 h-3.5 mr-1.5" /> Twitter
                            </Button>
                            <Button variant="outline" className="h-10 rounded-lg border-white/10 bg-white/5 text-white font-black uppercase text-[9px]" onClick={() => handleShare('facebook')}>
                              <Facebook className="w-3.5 h-3.5 mr-1.5" /> Facebook
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 flex-1 flex flex-col">
                        <div className="space-y-2">
                          <h3 className="text-3xl md:text-4xl font-headline font-black uppercase italic tracking-tighter">Enter to Win</h3>
                          <p className="text-zinc-400 font-medium italic text-base leading-snug">Share hobbydork with your collector friends to get your entry.</p>
                        </div>

                        <div className="space-y-3 pt-4">
                          <Button 
                            onClick={() => handleShare('twitter')} 
                            disabled={isSharing}
                            className="w-full h-16 bg-white text-black hover:bg-zinc-200 font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-between px-6"
                          >
                            <span className="flex items-center gap-3 text-sm font-black uppercase tracking-tight"><Twitter className="w-5 h-5 text-[#1DA1F2]" /> Post on Twitter</span>
                            <ChevronRight className="w-5 h-5 opacity-30" />
                          </Button>
                          
                          <Button 
                            onClick={() => handleShare('instagram')} 
                            disabled={isSharing}
                            className="w-full h-16 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-between px-6"
                          >
                            <span className="flex items-center gap-3 text-sm font-black uppercase tracking-tight"><Instagram className="w-5 h-5" /> Share on IG</span>
                            <ChevronRight className="w-5 h-5 opacity-30" />
                          </Button>

                          <Button 
                            onClick={() => handleShare('facebook')} 
                            disabled={isSharing}
                            className="w-full h-16 bg-[#1877F2] text-white hover:bg-[#1877F2]/90 font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-between px-6"
                          >
                            <span className="flex items-center gap-3 text-sm font-black uppercase tracking-tight"><Facebook className="w-5 h-5" /> Share on FB</span>
                            <ChevronRight className="w-5 h-5 opacity-30" />
                          </Button>

                          <Button 
                            onClick={() => handleShare('copy')} 
                            disabled={isSharing}
                            className="w-full h-16 bg-zinc-900 border border-white/5 text-white hover:bg-zinc-800 font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-between px-6"
                          >
                            <span className="flex items-center gap-3 text-sm font-black uppercase tracking-tight"><LinkIcon className="w-5 h-5 text-accent" /> Copy Link</span>
                            <ChevronRight className="w-5 h-5 opacity-30" />
                          </Button>
                        </div>

                        <div className="pt-8 border-t border-white/5 flex gap-4 items-start mt-auto">
                          <div className="bg-accent/20 p-2 rounded-lg shrink-0">
                            <ShieldCheck className="w-5 h-5 text-accent" />
                          </div>
                          <p className="text-[9px] font-black text-zinc-500 leading-relaxed uppercase tracking-widest">
                            Winners are chosen randomly. You don't need to buy anything to win. All draws are managed by hobbydork.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </aside>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
