
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  ShieldCheck, 
  Search, 
  Loader2, 
  Zap, 
  Truck, 
  ShieldAlert,
  History,
  ChevronRight,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { getRandomAvatar } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { TierBadge } from '@/components/TierBadge';
import Navbar from '@/components/Navbar';

export default function TrustBoard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !db) return;

    setIsSearching(true);
    setHasSearched(true);
    const target = searchQuery.trim().toLowerCase().replace('@', '');

    try {
      const usersSnap = await getDocs(query(collection(db, 'users'), where('username', '==', target), limit(1)));
      if (usersSnap.empty) {
        setSearchedUser(null);
        toast({ variant: 'destructive', title: "User not found", description: "This handle does not exist." });
      } else {
        const userData = usersSnap.docs[0].data();
        const uid = usersSnap.docs[0].id;
        setSearchedUser({ ...userData, uid });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Search failed" });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4">
        <header className="py-0 mb-16">
          <div className="max-w-5xl mx-auto trust-board-header-bg rounded-b-2xl p-6 md:p-12 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0 animate-scanline bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-1/4 opacity-40" />
            <div className="relative z-10 text-center space-y-8">
              <div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-500">CLASSIFIED // DOSSIER_ACCESS_TERMINAL</p>
                </div>
                <h1 className="text-4xl md:text-7xl font-mono font-black tracking-tighter uppercase leading-[0.9]">
                  Trust <span className="text-green-500">Board</span>
                </h1>
              </div>

              <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                <div className="bg-black/50 border-2 border-green-500/30 p-4 rounded-xl flex items-center gap-4 shadow-[0_0_30px_rgba(0,255,65,0.15)] backdrop-blur-sm">
                  <div className="relative flex-1">
                    <Label htmlFor="dossier-search" className="absolute -top-6 left-1 text-[9px] font-mono font-black uppercase tracking-[0.3em] text-green-500 animate-pulse">
                      ENTER_HANDLE
                    </Label>
                    <div className="flex items-center">
                        <span className="font-mono text-xl md:text-2xl text-green-500 mr-2">{'>'}</span>
                        <Input
                          id="dossier-search"
                          placeholder="_"
                          className="w-full bg-transparent border-none h-12 text-green-500 placeholder:text-green-500/30 focus-visible:ring-0 text-xl md:text-2xl font-mono font-black tracking-widest p-0 animate-pulse"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSearching} className="h-12 w-32 p-0 rounded-lg bg-green-500 text-black border-2 border-green-700 flex-shrink-0 font-mono font-black uppercase text-sm tracking-widest hover:bg-green-400 shadow-[0_0_20px_rgba(0,255,65,0.3)]">
                    {isSearching ? <Loader2 className="animate-spin w-5 h-5" /> : "QUERY"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 min-h-[500px]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <Loader2 className="w-16 h-16 animate-spin text-accent" />
              <p className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500 animate-pulse">Checking records...</p>
            </div>
          ) : !hasSearched ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 opacity-30">
              {[
                { icon: Zap, label: 'Verified Feedback', desc: 'Real delivered items' },
                { icon: Truck, label: 'Fast Shipping', desc: 'Ships within 2 days' },
                { icon: History, label: 'Trade Volume', desc: 'Successful sales' }
              ].map((box, i) => (
                <div key={i} className="p-12 border-4 border-solid border-zinc-200 dark:border-white/10 rounded-[3rem] flex flex-col items-center text-center gap-6">
                  <box.icon className="w-12 h-12" />
                  <div className="space-y-1">
                    <p className="font-black uppercase text-sm tracking-widest">{box.label}</p>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{box.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : !searchedUser ? (
            <div className="py-32 text-center border-8 border-dashed rounded-[4rem] bg-zinc-50 dark:bg-zinc-900/20">
              <ShieldAlert className="w-20 h-24 text-zinc-200 dark:text-zinc-800 mx-auto mb-8" />
              <h3 className="text-3xl font-black uppercase italic text-zinc-300">Seller Not Found</h3>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-12 duration-700">
              <Card className="border-none shadow-[0_20px_40px_rgba(0,0,0,0.08)] bg-card rounded-3xl overflow-hidden">
                <div className="bg-zinc-950 p-5 md:p-8 text-white relative">
                  <div className="absolute inset-0 hardware-grid-overlay opacity-5" />
                  <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white/10 shadow-xl bg-zinc-900 shrink-0">
                      <Image 
                        src={searchedUser.photoURL || getRandomAvatar(searchedUser.uid)} 
                        alt={searchedUser.username} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <h2 className="text-2xl md:text-4xl font-headline font-black uppercase italic tracking-tighter leading-none">@{searchedUser.username}</h2>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        <TierBadge tier={searchedUser.sellerTier} className="scale-110 origin-left" />
                        <Badge variant="outline" className="h-8 px-4 border-2 border-accent text-accent font-black uppercase text-[10px] tracking-[0.2em] bg-accent/5 italic rounded-full shadow">Verified Seller</Badge>
                      </div>
                    </div>
                    <Button asChild className="h-10 px-6 bg-white text-black font-black rounded-xl shadow uppercase tracking-tighter text-sm shrink-0 hover:bg-zinc-200 transition-all active:scale-95">
                      <Link href={`/storefronts/${searchedUser.username}`}>Visit Shop</Link>
                    </Button>
                  </div>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-2 border-solid border-zinc-100 dark:border-white/5 space-y-2 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Successful Trades</p>
                    <p className="text-2xl font-headline font-black text-primary italic tracking-tighter">{searchedUser.completedOrders || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-2 border-solid border-zinc-100 dark:border-white/5 space-y-2 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">On-Time Shipping</p>
                    <p className="text-2xl font-headline font-black text-green-600 italic tracking-tighter">{searchedUser.onTimeShippingRate ? `${Math.round(searchedUser.onTimeShippingRate * 100)}%` : '100%'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border-2 border-solid border-zinc-100 dark:border-white/5 space-y-2 shadow-inner">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Community Rating</p>
                    <div className="flex gap-1.5 text-yellow-500 pt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-current drop-shadow" />)}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
