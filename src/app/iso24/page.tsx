'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import '@/app/digital-time.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageCircle, Clock, Loader2, Search as SearchIcon, Info, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

export default function ISO24Feed() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

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
      return postedAtTime > oneDayAgo && item.status !== 'Found';
    });
  }, [isoItems]);

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
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="w-full flex justify-center mb-12">
          <div className="w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-4 border-zinc-900 bg-zinc-900 py-10 px-4 flex flex-col items-center justify-center relative overflow-hidden">
            <Image src="/ISO.jpg" alt="ISO24" width={400} height={120} priority className="relative z-10" />
            <Dialog>
              <DialogTrigger asChild>
                <button title="Help" className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"><Info className="w-6 h-6" /></button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>About ISO24</DialogTitle></DialogHeader>
                <DialogDescription className="text-base font-medium pt-2">
                  <strong>ISO24</strong> is a live 24-hour feed where collectors can request items they are hunting for. All posts are purged after 24 hours to keep the feed fresh.
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex justify-between items-center mb-12">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight">Active Requests</h2>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{activeHunts.length} hunts in progress</p>
          </div>
          <Button asChild className="bg-accent hover:bg-accent/90 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-accent/20">
            <Link href="/iso24/create"><PlusCircle className="w-4 h-4 mr-2" /> New Request</Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="animate-spin w-10 h-10 mx-auto text-accent" /></div>
          ) : activeHunts.length === 0 ? (
            <Card className="p-20 text-center border-4 border-dashed rounded-[3rem] bg-muted/20">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="font-black uppercase text-sm text-muted-foreground">No active hunts located.</p>
            </Card>
          ) : activeHunts.map(item => (
            <Card key={item.id} className="p-8 group shadow-lg hover:shadow-2xl transition-all border-none bg-card rounded-[2rem] relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-accent text-accent uppercase font-black text-[9px] tracking-widest px-3 py-1">{item.category}</Badge>
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-accent animate-pulse"><Clock className="w-3 h-3" /> ACTIVE SEARCH</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-headline font-black uppercase italic tracking-tight leading-none">{item.title}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed line-clamp-2 max-w-2xl">{item.description}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className="text-xs font-black uppercase">@{item.userName}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Budget: <span className="text-primary">${item.budget?.toLocaleString()}</span></span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 justify-center shrink-0">
                  {user?.uid === item.uid ? (
                    <Button onClick={() => handleMarkFound(item.id)} className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-lg">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Found
                    </Button>
                  ) : (
                    <Button onClick={() => handleContactCollector(item)} className="bg-primary text-white font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-lg">
                      <MessageCircle className="w-4 h-4 mr-2" /> Message Collector
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
