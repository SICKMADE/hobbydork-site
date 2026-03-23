
'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  ShieldCheck, 
  Search, 
  Award, 
  ShoppingBag, 
  ArrowRight, 
  Loader2, 
  Terminal, 
  Zap, 
  Truck, 
  CheckCircle2, 
  ShieldAlert,
  Activity,
  History,
  User,
  Ghost,
  Cpu,
  Heart
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { getRandomAvatar } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, where, doc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';

export default function TrustBoard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [searchedStore, setSearchedStore] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  // Queries for the searched dealer's reviews
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !searchedUser?.uid) return null;
    return query(
      collection(db, 'reviews'), 
      where('sellerId', '==', searchedUser.uid), 
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
  }, [db, searchedUser?.uid]);

  const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !db) return;

    setIsSearching(true);
    setHasSearched(true);
    const target = searchQuery.trim().toLowerCase().replace('@', '');

    try {
      // 1. Find the User Document
      const usersSnap = await getDocs(query(collection(db, 'users'), where('username', '==', target), limit(1)));
      
      if (usersSnap.empty) {
        setSearchedUser(null);
        setSearchedStore(null);
        toast({ 
          variant: 'destructive', 
          title: "Target Not Located", 
          description: "This handle does not exist in our dealer network." 
        });
      } else {
        const userData = usersSnap.docs[0].data();
        const uid = usersSnap.docs[0].id;
        setSearchedUser({ ...userData, uid });

        // 2. Find associated Storefront Document for total sales / spotlight status
        const storeSnap = await getDocs(query(collection(db, 'storefronts'), where('ownerUid', '==', uid), limit(1)));
        if (!storeSnap.empty) {
          setSearchedStore(storeSnap.docs[0].data());
        } else {
          setSearchedStore(null);
        }
      }
    } catch (e) {
      toast({ 
        variant: 'destructive', 
        title: "Protocol Error", 
        description: "Could not establish connection to archive nodes." 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchedUser(null);
    setSearchedStore(null);
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Background Matrix Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] hardware-grid-overlay z-0" />

      <main className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        <header className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/10 rounded-[2rem] mb-4 border-2 border-accent/20 animate-in zoom-in duration-700 text-accent">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-headline font-black uppercase italic tracking-tighter text-primary leading-none">
              Dealer <span className="text-accent">Dossier</span>
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed uppercase tracking-widest opacity-60">
              [ IDENTITY_VERIFICATION_PROTOCOL_V4.2 ]
            </p>
          </div>

          <form onSubmit={handleSearch} className="max-w-xl mx-auto relative pt-8 group">
            <div className="absolute inset-0 bg-accent blur-3xl opacity-5 group-focus-within:opacity-10 transition-opacity" />
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <Terminal className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                <Input 
                  placeholder="ENTER_DEALER_HANDLE"
                  className="pl-14 h-16 rounded-2xl border-4 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-black text-lg tracking-widest focus-visible:ring-accent focus-visible:border-accent shadow-2xl transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                />
              </div>
              <Button type="submit" disabled={isSearching} className="h-16 px-10 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 group/btn">
                {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />}
              </Button>
            </div>
            {hasSearched && (
              <button 
                type="button" 
                onClick={clearSearch}
                className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors"
              >
                [ RESET_DISCOVERY ]
              </button>
            )}
          </form>
        </header>

        <div className="min-h-[400px]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-accent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-accent animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Decrypting Node Archive...</p>
            </div>
          ) : !hasSearched ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-40 grayscale">
              {[
                { icon: Zap, label: 'Atomic Vouches', desc: 'Real delivered items' },
                { icon: Truck, label: 'Shipping Pulse', desc: 'Actual carrier speed' },
                { icon: History, label: 'Trade Volume', desc: 'Lifetime GMV record' }
              ].map((box, i) => (
                <div key={i} className="p-8 border-2 border-dashed rounded-[2rem] flex flex-col items-center text-center gap-4">
                  <box.icon className="w-8 h-8" />
                  <div className="space-y-1">
                    <p className="font-black uppercase text-xs tracking-widest">{box.label}</p>
                    <p className="text-[10px] font-bold opacity-60">{box.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : !searchedUser ? (
            <Card className="p-20 text-center border-4 border-dashed rounded-[3rem] bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/20">
              <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-6" />
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic text-red-600">No Match Found</h3>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Ensure handle is correctly stenciled.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
              {/* Main Dossier Card */}
              <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.1)] bg-card rounded-[3rem] overflow-hidden relative border-2 border-zinc-100 dark:border-white/5">
                <div className="bg-zinc-950 p-8 md:p-12 text-white relative">
                  <div className="absolute inset-0 opacity-10 hardware-grid-overlay" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-zinc-900 shrink-0">
                      <Image 
                        src={searchedUser.photoURL || getRandomAvatar(searchedUser.uid)} 
                        alt={searchedUser.username} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                          <h2 className="text-4xl md:text-6xl font-headline font-black uppercase italic tracking-tighter">@{searchedUser.username}</h2>
                          <ShieldCheck className="w-10 h-10 text-accent" />
                        </div>
                        <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-[10px]">Verified Network Operator</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <TierBadge tier={searchedUser.sellerTier} className="bg-white/5 border-white/20" />
                        <Badge variant="outline" className="h-10 px-6 rounded-xl border-accent/40 text-accent font-black uppercase tracking-widest text-[10px] bg-accent/5">
                          <Activity className="w-3.5 h-3.5 mr-2 animate-pulse" /> Status: ACTIVE
                        </Badge>
                      </div>
                    </div>
                    <Button asChild className="h-16 px-10 bg-white text-zinc-950 hover:bg-zinc-200 font-black rounded-2xl shadow-2xl uppercase tracking-tighter text-lg shrink-0">
                      <Link href={`/shop/${searchedUser.username}`}>Visit Store <ArrowRight className="ml-3 w-6 h-6" /></Link>
                    </Button>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { 
                        label: 'ATOMIC VOUCHES', 
                        val: searchedUser.completedOrders || 0, 
                        icon: CheckCircle2, 
                        color: 'text-green-600',
                        desc: 'Verified Deliveries'
                      },
                      { 
                        label: 'HEALTH PROTOCOL', 
                        val: searchedUser.onTimeShippingRate ? `${Math.round(searchedUser.onTimeShippingRate * 100)}%` : '100%', 
                        icon: Heart, 
                        color: 'text-red-600',
                        desc: 'Node Pulse'
                      },
                      { 
                        label: 'TRADE VOLUME', 
                        val: searchedStore?.totalSales || 0, 
                        icon: History, 
                        color: 'text-accent',
                        desc: 'Items Sold'
                      },
                      { 
                        label: 'SATISFACTION', 
                        val: '5.0', 
                        icon: Star, 
                        color: 'text-yellow-500',
                        desc: 'Collector Rating'
                      }
                    ].map((stat, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-muted/30 border-2 border-border/50 space-y-4 group transition-all hover:bg-card hover:border-accent/20">
                        <div className="flex justify-between items-start">
                          <div className={cn("p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-sm", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">{stat.desc}</span>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                          <p className={cn("text-3xl font-headline font-black italic tracking-tighter leading-none pt-1", stat.color)}>{stat.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                      <History className="w-5 h-5 text-accent" />
                      <h3 className="font-headline font-black uppercase text-xl italic tracking-tight">Recent Vouch History</h3>
                    </div>
                    
                    <div className="grid gap-4">
                      {reviewsLoading ? (
                        <div className="py-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-accent mx-auto" /></div>
                      ) : !reviews || reviews.length === 0 ? (
                        <div className="py-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed">
                          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest italic">Awaiting community feedback logs...</p>
                        </div>
                      ) : (
                        reviews.map(vouch => (
                          <div key={vouch.id} className="p-6 rounded-2xl bg-card border-2 transition-all hover:border-accent/20 shadow-sm flex flex-col sm:flex-row gap-6 items-center sm:items-start text-card-foreground">
                            <div className="flex gap-1 text-yellow-500 shrink-0">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <Star key={s} className={cn("w-4 h-4 fill-current", s < vouch.rating ? "text-yellow-500" : "text-zinc-200")} />
                              ))}
                            </div>
                            <div className="flex-1 space-y-2 text-center sm:text-left">
                              <p className="text-sm font-bold leading-relaxed italic">"{vouch.comment}"</p>
                              <div className="flex items-center justify-center sm:justify-start gap-3">
                                <span className="text-[10px] font-black uppercase text-accent">@{vouch.buyerName || 'COLLECTOR'}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{vouch.timestamp?.toDate ? new Date(vouch.timestamp.toDate()).toLocaleDateString() : 'Just now'}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="rounded-lg h-8 px-4 font-black uppercase text-[8px] tracking-widest bg-zinc-100 dark:bg-zinc-800">
                              ATOMIC_VOUCH
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Legal/Disclaimer Footer */}
              <div className="flex items-start gap-4 p-8 bg-zinc-950 text-white rounded-[2.5rem] border-none shadow-2xl">
                <ShieldCheck className="w-8 h-8 text-accent shrink-0 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-black uppercase italic tracking-tight">Trust Protocol Security</h4>
                  <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase tracking-tight">
                    All metrics displayed in this dossier are calculated from transaction-locked events (Stripe receipts and carrier scan logs). Data is permanent and cannot be modified by the dealer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
