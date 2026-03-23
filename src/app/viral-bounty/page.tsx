
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
  Search
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
      toast({ variant: 'destructive', title: "Action Denied", description: "Sign in to participate in the protocol." });
      return;
    }

    const shareUrl = "https://hobbydork.com";
    const shareText = `Check out hobbydork, the definitive social marketplace for collectors! Join me in the lobby. 🚀 #hobbydork #collectors #${activeBounty.title.replace(/\s+/g, '')}`;

    let url = "";
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied for Instagram!", description: "Paste it in your bio or stories to enter!" });
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
          // Entry count is handled by backend trigger onPlatformBountyEntryCreated
          setHasEntered(true);
          toast({ title: "Ticket Secured!", description: "You have been entered into the Big Bounty draw." });
        })
        .catch(() => {
          toast({ variant: 'destructive', title: "Entry Failed", description: "Protocol sync error. Please try again." });
        })
        .finally(() => {
          setIsSharing(false);
        });
    }
  };

  const steps = [
    "Share hobbydork.com URL",
    "Secure your entry ticket",
    "Wait for the live draw",
    "Score the grail prize"
  ];

  const bountyPlaceholder = PlaceHolderImages.find(img => img.id === 'default-listing')?.imageUrl || '/defaultbroken.jpg';

  if (bountyLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-accent" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Syncing Bounty Protocol</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20 mb-4 animate-in fade-in zoom-in duration-700">
            <Zap className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Viral Protocol Active</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-none text-primary">
            THE <span className="text-accent">BIG BOUNTY.</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
            Grow the community, score the grails. Share hobbydork.com to earn your digital entry ticket for our platform drops.
          </p>
        </header>

        <div className="mb-12 bg-muted/40 dark:bg-card/60 border-2 border-dashed border-border rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-stretch">
            {steps.map((step, i) => (
              <div key={i} className="flex-1 flex items-center p-6 gap-4 relative">
                <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-black text-xs shrink-0 shadow-lg shadow-accent/20">
                  {i + 1}
                </div>
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary leading-tight">
                  {step}
                </p>
                {i < steps.length - 1 && (
                  <>
                    <div className="hidden md:block absolute right-0 top-6 bottom-6 w-[1px] bg-border/50" />
                    <div className="md:hidden absolute bottom-0 left-6 right-6 h-[1px] bg-border/50" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {!activeBounty ? (
            <div className="col-span-full py-32 text-center bg-muted/20 rounded-[3rem] border-4 border-dashed space-y-6">
              <Search className="w-16 h-16 text-zinc-300 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic">Protocol Idle</h3>
                <p className="text-muted-foreground font-medium italic">No active platform drops located. Check back soon for the next Big Bounty.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-card transition-all hover:scale-[1.01]">
                  <div className="relative aspect-video w-full bg-zinc-900">
                    <Image 
                      src={activeBounty.imageUrl || bountyPlaceholder} 
                      alt={activeBounty.title} 
                      fill 
                      className="object-cover opacity-80"
                      data-ai-hint="collectible card"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
                    <div className="absolute bottom-6 md:bottom-8 left-6 md:left-8 right-6 md:right-8">
                      <div className="space-y-2">
                        <Badge className="bg-accent text-white border-none px-3 py-1 font-black uppercase text-[10px] tracking-widest shadow-xl">
                          PLATFORM DROP
                        </Badge>
                        <h2 className="text-2xl md:text-4xl font-headline font-black text-white leading-tight uppercase italic">
                          {activeBounty.title}
                        </h2>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 md:p-10 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-accent" /> Mission Brief
                      </h3>
                      <p className="text-muted-foreground font-medium leading-relaxed text-base md:text-lg italic">
                        "{activeBounty.description}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center text-center gap-3">
                        <Clock className="w-8 h-8 text-zinc-400" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Draw Date</p>
                          <p className="text-lg font-black uppercase">
                            {activeBounty.endsAt?.toDate ? activeBounty.endsAt.toDate().toLocaleDateString() : 'TBD'}
                          </p>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-accent/5 border-2 border-dashed border-accent/20 flex flex-col items-center text-center gap-3">
                        <Gift className="w-8 h-8 text-accent" />
                        <div>
                          <p className="text-[10px] font-black uppercase text-accent tracking-widest">Prize Status</p>
                          <p className="text-lg font-black uppercase">Secured</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside>
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-muted/40 dark:bg-card/60 p-6 md:p-10 overflow-hidden h-full">
                  {isCheckingEntry ? (
                    <div className="py-20 text-center space-y-4">
                      <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Checking Vault Status</p>
                    </div>
                  ) : hasEntered ? (
                    <div className="py-10 text-center space-y-8 animate-in zoom-in duration-500 h-full flex flex-col justify-center">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                        <div className="relative w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                          <CheckCircle2 className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-headline font-black uppercase italic leading-none">Ticket Secured</h3>
                        <p className="text-zinc-400 font-medium italic">You are in the draw for the {activeBounty.title}.</p>
                      </div>
                      <div className="pt-6 border-t border-zinc-200 dark:border-white/10 mt-auto">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-4">Sharing earns respect</p>
                        <div className="flex justify-center gap-4">
                          <Button variant="outline" size="icon" className="rounded-full border-zinc-200 dark:border-white/10 bg-white/5 hover:bg-white/10" title="Share on X" onClick={() => handleShare('twitter')}>
                            <Twitter className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="rounded-full border-zinc-200 dark:border-white/10 bg-white/5 hover:bg-white/10" title="Share on Facebook" onClick={() => handleShare('facebook')}>
                            <Facebook className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 h-full flex flex-col">
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-headline font-black uppercase italic tracking-tighter leading-none">Enter the Bounty</h3>
                        <p className="text-muted-foreground font-medium">Claim your ticket by sharing the lobby URL.</p>
                      </div>

                      <div className="space-y-3">
                        <Button 
                          onClick={() => handleShare('twitter')} 
                          disabled={isSharing}
                          className="w-full h-14 md:h-16 bg-zinc-950 hover:bg-zinc-900 text-white rounded-2xl font-black gap-3 shadow-xl transition-all active:scale-95 border border-white/10"
                        >
                          <Twitter className="w-5 h-5" /> Share on X
                        </Button>
                        <Button 
                          onClick={() => handleShare('instagram')} 
                          disabled={isSharing}
                          className="w-full h-14 md:h-16 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white rounded-2xl font-black gap-3 shadow-xl transition-all active:scale-95"
                        >
                          <Instagram className="w-5 h-5" /> Share on Instagram
                        </Button>
                        <Button 
                          onClick={() => handleShare('facebook')} 
                          disabled={isSharing}
                          className="w-full h-14 md:h-16 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white rounded-2xl font-black gap-3 shadow-xl transition-all active:scale-95"
                        >
                          <Facebook className="w-5 h-5" /> Share on Facebook
                        </Button>
                        <Button 
                          onClick={() => handleShare('copy')} 
                          disabled={isSharing}
                          variant="outline"
                          className="w-full h-14 md:h-16 rounded-2xl border-zinc-200 dark:border-white/10 bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 font-black gap-3 transition-all active:scale-95"
                        >
                          <LinkIcon className="w-5 h-5" /> Copy Link
                        </Button>
                      </div>

                      <div className="pt-6 border-t border-zinc-200 dark:border-white/10 flex gap-4 items-start mt-auto">
                        <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-tight">
                          Platform drops are verified and fulfilled by hobbydork. No purchase necessary. Void where prohibited.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              </aside>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
