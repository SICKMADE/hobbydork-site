'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageCircle, Clock, Loader2, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function ISO24Feed() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  // Real-time queries
  const isoQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'iso24Posts'), orderBy('postedAt', 'desc'), limit(100));
  }, [db]);

  const { data: isoItems, isLoading: loading } = useCollection(isoQuery);

  // Filter posts older than 24 hours
  const activeHunts = useMemo(() => {
    if (!isoItems) return [];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return isoItems.filter(item => {
      // Handle Firebase Timestamps or standard dates
      const postedAtTime = item.postedAt?.toDate ? item.postedAt.toDate().getTime() : new Date(item.postedAt).getTime();
      return postedAtTime > oneDayAgo;
    });
  }, [isoItems]);

  const handleContactCollector = (item: any) => {
    toast({ title: 'Chat System', description: 'Opening secure channel...' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-headline font-black">ISO<span className="text-accent">24</span></h1>
            <p className="text-muted-foreground text-lg max-w-xl font-medium">Real-time community searches. All requests automatically expire after 24 hours.</p>
          </div>
          <Button asChild className="bg-accent text-white font-black h-12 px-8 rounded-full shadow-lg">
            <Link href="/iso24/create"><PlusCircle className="w-4 h-4 mr-2" /> Post Request</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <Card className="p-6 space-y-4">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Status</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start text-accent bg-accent/5 rounded-xl">Active Hunts ({activeHunts.length})</Button>
                <div className="p-4 bg-muted/30 rounded-xl">
                  <p className="text-[9px] font-black uppercase text-muted-foreground leading-tight">Posts are purged from this view 24 hours after submission.</p>
                </div>
              </div>
            </Card>
          </aside>

          <div className="md:col-span-3 space-y-6">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
                <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Scanning Active Hunts</p>
              </div>
            ) : activeHunts.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-[2rem] space-y-4">
                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <div className="space-y-1">
                  <p className="font-bold text-muted-foreground uppercase text-xs">No active hunts found.</p>
                  <p className="text-[10px] text-muted-foreground italic">Be the first to post a search today.</p>
                </div>
              </div>
            ) : activeHunts.map(item => (
              <Card key={item.id} className="p-8 group shadow-md hover:shadow-xl transition-all border-none bg-card rounded-[2rem]">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className="border-accent text-accent uppercase font-black text-[9px]">{item.category}</Badge>
                  <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-accent animate-pulse"><Clock className="w-3 h-3" /> ACTIVE SEARCH</span>
                </div>
                <h3 className="text-2xl font-headline font-black uppercase italic mb-2 group-hover:text-accent transition-colors">{item.title}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase">@{item.userName || 'Anonymous'}</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">• Budget: ${item.budget?.toLocaleString()}</span>
                  </div>
                  <Button onClick={() => handleContactCollector(item)} className="bg-primary text-white rounded-full h-10 px-6 gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
