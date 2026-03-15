'use client';

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { GIVEAWAYS } from '@/lib/mock-data';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Gift, 
  Trophy, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { functions } from '@/firebase/client';
import { doc, updateDoc, increment, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function GiveawayDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [isEntering, setIsEntering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [checkingFollow, setCheckingFollow] = useState(true);
  const [isDrawingWinner, setIsDrawingWinner] = useState(false);

  const giveawayRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'giveaways', id);
  }, [db, id]);

  const { data: firestoreGiveaway, isLoading: loading } = useDoc(giveawayRef);
  const mockGiveaway = GIVEAWAYS.find(g => g.id === id);
  const giveaway = firestoreGiveaway || mockGiveaway;

  useEffect(() => {
    if (!db || !user || !giveaway) {
      setCheckingFollow(false);
      return;
    }
    const sellerName = giveaway.sellerName || giveaway.seller;
    const followId = `${user.uid}_${sellerName}`;
    const followRef = doc(db, 'followers', followId);
    
    getDoc(followRef).then((snap) => {
      setIsFollowing(snap.exists());
      setCheckingFollow(false);
    });
  }, [db, user, giveaway]);

  useEffect(() => {
    if (!db || !user || !id) return;
    const entryRef = doc(db, 'giveaways', id, 'giveawayEntries', user.uid);
    getDoc(entryRef).then(snap => setHasEntered(snap.exists()));
  }, [db, user, id]);

  if (loading || checkingFollow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!giveaway) return <div className="p-12 text-center text-muted-foreground font-black uppercase tracking-widest">Giveaway not found</div>;

  const handleEnter = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Auth Required', description: 'Sign in to enter giveaways.' });
      return;
    }
    if (!isFollowing) {
      toast({ 
        variant: 'destructive', 
        title: 'Follow Required', 
        description: `You must follow @${giveaway.sellerName || giveaway.seller} to enter this drop.` 
      });
      return;
    }
    if (!db || !giveawayRef) return;

    setIsEntering(true);

    const entryData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      isFollowing: true,
      timestamp: serverTimestamp()
    };

    const entryRef = doc(db, 'giveaways', id, 'giveawayEntries', user.uid);

    setDoc(entryRef, entryData)
      .then(() => {
        updateDoc(giveawayRef, { entriesCount: increment(1) });
        setHasEntered(true);
        setIsEntering(false);
        toast({ title: 'Entry Confirmed!', description: 'You have been entered into the live drop.' });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `giveaways/${id}/giveawayEntries/${user.uid}`,
          operation: 'create',
          requestResourceData: entryData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsEntering(false);
      });
  };

  const handleDrawWinner = async () => {
    if (!user || !functions) return;
    
    setIsDrawingWinner(true);
    try {
      const drawWinner = httpsCallable(functions, 'drawGiveawayWinner');
      const result: any = await drawWinner({ giveawayId: id });
      
      if (result.data.winner) {
        toast({ title: '🎉 Winner Drawn!', description: `Congratulations to ${result.data.winner.userName}!` });
      } else {
        toast({ title: 'Giveaway Ended', description: 'No entries were submitted.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: getFriendlyErrorMessage(error) });
    } finally {
      setIsDrawingWinner(false);
    }
  };

  // ALIGNED: check seller UID against user UID
  const isSellerOwner = user && giveaway && (user.uid === giveaway.sellerId || user.uid === giveaway.seller);

  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href={`/shop/${giveaway.sellerName || giveaway.seller}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" />
          Back to {giveaway.sellerName || giveaway.seller}'s shop
        </Link>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-12 md:gap-16">
          <div className="space-y-8">
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <Image src={giveaway.imageUrl} alt={giveaway.title} fill className="object-cover" />
              <div className="absolute top-8 left-8">
                <Badge className="bg-zinc-950 text-white border-none px-6 py-3 text-xl font-black shadow-2xl uppercase tracking-tighter">
                  <Gift className="w-6 h-6 mr-3 text-zinc-400" /> LIVE DROP
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <h1 className="text-3xl md:text-5xl font-headline font-black leading-[0.9] uppercase italic tracking-tighter text-primary">
              {giveaway.title}
            </h1>

            <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-[2.5rem]">
              <CardContent className="p-10 space-y-8">
                {giveaway.status === 'Ended' ? (
                  <div className="bg-zinc-100 p-8 rounded-2xl text-center border-2 border-dashed">
                    <Trophy className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                    <h3 className="font-black text-xl uppercase text-zinc-500">Drop Concluded</h3>
                    {giveaway.winnerName && <p className="text-sm font-bold text-muted-foreground mt-2">Winner: {giveaway.winnerName}</p>}
                  </div>
                ) : isSellerOwner ? (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest">You are the host</p>
                    <Button 
                      onClick={handleDrawWinner} 
                      disabled={isDrawingWinner}
                      className="w-full h-20 text-2xl font-black rounded-2xl shadow-xl uppercase italic tracking-tighter bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    >
                      {isDrawingWinner ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2" /> Draw Winner</>}
                    </Button>
                  </div>
                ) : !hasEntered ? (
                  <Button 
                    onClick={handleEnter} 
                    disabled={isEntering}
                    className={cn(
                      "w-full h-20 text-2xl font-black rounded-2xl shadow-2xl uppercase italic tracking-tighter",
                      !isFollowing ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-zinc-950 text-white hover:bg-zinc-800"
                    )}
                  >
                    {isEntering ? <Loader2 className="animate-spin" /> : !isFollowing ? 'Follow Seller to Enter' : 'Enter Drop Now'}
                  </Button>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border-4 border-dashed border-green-200 p-8 rounded-2xl text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="font-black text-2xl text-green-900 uppercase">You're Entered!</h3>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}