'use client';

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  ShieldCheck, 
  Store, 
  MessageSquare, 
  Loader2, 
  CreditCard, 
  Lock,
  Flag,
  AlertTriangle,
  Gavel,
  ArrowLeft,
  Heart,
  Share2,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, query, orderBy, limit, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, getRandomAvatar, filterProfanity } from '@/lib/utils';
import { TierBadge } from '@/components/TierBadge';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isWatched, setIsWatched] = useState(false);
  const [isWatchLoading, setIsWatchLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('/defaultbroken.jpg');

  const listingRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'listings', id);
  }, [db, id]);

  const profileRef = useMemoFirebase(() => user && db ? doc(db, 'users', user.uid) : null, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const bidsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'listings', id, 'bids'), orderBy('amount', 'desc'), limit(10));
  }, [db, id]);

  const { data: listing, isLoading: listingLoading } = useDoc(listingRef);
  const { data: bidsHistory, isLoading: bidsLoading } = useCollection(bidsQuery);

  useEffect(() => {
    if (!user || !db || !id) return;
    const watchRef = doc(db, 'users', user.uid, 'watchlist', id);
    getDoc(watchRef).then(snap => setIsWatched(snap.exists()));
  }, [user, db, id]);

  useEffect(() => {
    if (!listing || listing.type !== 'Auction' || !listing.endsAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endsAt = listing.endsAt.toDate ? listing.endsAt.toDate() : new Date(listing.endsAt);
      const diff = endsAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('AUCTION ENDED');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) setTimeRemaining(`${days}d ${hours}h ${mins}m`);
        else if (hours > 0) setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
        else setTimeRemaining(`${mins}m ${secs}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [listing]);

  useEffect(() => {
    if (listing?.imageUrl) {
      setImgSrc(listing.imageUrl.trim());
    }
  }, [listing]);

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) return <div className="p-12 text-center text-muted-foreground font-black uppercase tracking-widest">Listing not found</div>;

  const isAuction = listing.type === 'Auction';
  const auctionEnded = isAuction && (isExpired || listing.status === 'Ended');
  const isAuctionWinner = !!(user && listing.winnerUid === user.uid && listing.paymentStatus === 'PENDING');
  const currentPrice = isAuction ? (listing.currentBid || listing.price) : listing.price;
  const shippingCost = listing.shippingCost || 0;

  const handleToggleWatchlist = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Sign In Required', description: 'Sign in to add items to your vault watchlist.' });
      return;
    }
    if (!db || !id) return;

    setIsWatchLoading(true);
    const watchRef = doc(db, 'users', user.uid, 'watchlist', id);

    try {
      if (isWatched) {
        await deleteDoc(watchRef);
        setIsWatched(false);
        toast({ title: "Removed from Watchlist" });
      } else {
        await setDoc(watchRef, {
          listingId: id,
          title: listing.title,
          price: listing.currentBid || listing.price,
          imageUrl: listing.imageUrl || null,
          timestamp: serverTimestamp()
        });
        setIsWatched(true);
        toast({ title: "Added to Watchlist", description: "You will receive updates about this item." });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Action Failed" });
    } finally {
      setIsWatchLoading(false);
    }
  };

  const handlePlaceBid = async () => {
    if (!user || !listing) {
      toast({ variant: 'destructive', title: 'Sign In Required', description: 'Please sign in to place a bid.' });
      return;
    }

    if (!user.emailVerified || profile?.status !== 'ACTIVE') {
      toast({ 
        variant: 'destructive', 
        title: 'Verification Required', 
        description: 'You must verify your email and have an active profile to place bids.' 
      });
      return;
    }

    const amount = parseFloat(bidAmount);
    const priceToBeat = listing.currentBid || listing.price;
    if (isNaN(amount) || amount <= priceToBeat) {
      toast({ variant: 'destructive', title: 'Invalid Bid', description: `Your bid must be higher than $${priceToBeat.toLocaleString()}.` });
      return;
    }

    setIsBidding(true);

    try {
      const functions = getFunctions();
      const placeBidCallable = httpsCallable(functions, 'placeBid');
      await placeBidCallable({ auctionId: id, amount });
      
      toast({ title: 'Bid Placed!', description: `Successfully bid $${amount.toLocaleString()}.` });
      setBidAmount('');
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Bid Failed', 
        description: getFriendlyErrorMessage(error) 
      });
    } finally {
      setIsBidding(false);
    }
  };

  const handleProceedCheckout = () => {
    if (!user) { router.push('/login'); return; }
    const amountCents = Math.round(Number(currentPrice) * 100);
    router.push(`/checkout?listing=${listing.id}&amount=${amountCents}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-bold uppercase tracking-widest text-primary">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            {user && listing.listingSellerId === user.uid && (
              <Link href={`/listings/${id}/edit`} className="text-muted-foreground hover:text-primary gap-2 font-black uppercase text-[10px] flex items-center">
                ✎ Edit Listing
              </Link>
            )}
            <button onClick={() => setIsReportDialogOpen(true)} className="text-muted-foreground hover:text-red-600 gap-2 font-black uppercase text-[10px] flex items-center">
              <Flag className="w-3.5 h-3.5" /> Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-muted/20 border-4 border-white dark:border-zinc-800 shadow-2xl">
              <Image 
                src={imgSrc} 
                alt={listing.title} 
                fill 
                className="object-contain" 
                onError={() => setImgSrc('/defaultbroken.jpg')}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border-none">{listing.category}</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" disabled={isWatchLoading} onClick={handleToggleWatchlist} title="Add to watchlist" aria-label="Add to watchlist" className={cn("rounded-full w-10 h-10 transition-all", isWatched ? "text-red-600 bg-red-50" : "hover:bg-primary/10 hover:text-primary")}>
                    {isWatchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={cn("w-5 h-5", isWatched && "fill-current")} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {navigator.clipboard.writeText(window.location.href); toast({title: "Link Copied"})}} title="Share listing" aria-label="Share listing" className="rounded-full w-10 h-10"><Share2 className="w-5 h-5" /></Button>
                </div>
              </div>
              <h1 className="text-3xl md:text-5xl font-headline font-black leading-[0.9] uppercase text-primary tracking-tighter">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <Link href={`/storefronts/${listing.sellerName || listing.seller}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><Store className="w-4 h-4 text-white" /></div>
                  <span className="text-primary font-black uppercase tracking-tight">@{listing.sellerName || listing.seller}</span>
                  {listing.sellerTier && (
                    <span className="ml-2"><TierBadge tier={listing.sellerTier} /></span>
                  )}
                </Link>
                <span className="text-primary flex items-center gap-1 font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4" /> Verified</span>
                <span className="text-muted-foreground font-bold uppercase tracking-widest border-l pl-6">Condition: {listing.condition}</span>
              </div>
            </div>

            {isAuction && (
              <div className={cn("p-6 rounded-2xl flex items-center justify-between border-2 animate-in fade-in duration-500", isExpired ? "bg-zinc-50 border-zinc-200 text-zinc-400" : "bg-accent/5 border-accent/20 text-accent")}>
                <div className="flex items-center gap-3"><Clock className="w-6 h-6" /><span className="text-xs font-black uppercase tracking-widest">Time Remaining</span></div>
                <span className="font-black text-2xl italic digital-time">{timeRemaining}</span>
              </div>
            )}

            <div className="bg-card p-10 rounded-[2.5rem] border shadow-2xl space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">{isAuction ? 'Current Bid' : 'Asset Price'}</p>
                  <p className="text-5xl font-black text-primary">${currentPrice.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">Carrier Protocol</p>
                  <div className="flex items-center gap-2 text-sm font-black text-primary">
                    <Truck className="w-4 h-4 text-primary opacity-60" />
                    {shippingCost > 0 ? `$${shippingCost.toLocaleString()} shipping` : 'FREE SHIPPING'}
                  </div>
                </div>
              </div>

              {listing.status === 'Sold' ? (
                <div className="bg-zinc-100 p-8 rounded-2xl text-center border-4 border-dashed">
                  <Badge className="bg-zinc-500 text-white mb-3 uppercase font-black px-6 py-2 text-lg">SOLD</Badge>
                  <p className="font-bold text-zinc-500 uppercase text-xs tracking-widest">Asset Secured by Collector</p>
                </div>
              ) : isAuction ? (
                <div className="space-y-4">
                  {!auctionEnded ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-lg">$</span>
                        <Input id="bid-amount" placeholder="Bid amount" className="pl-10 h-16 rounded-2xl text-xl font-black border-2 focus-visible:ring-primary" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                      </div>
                      <Button onClick={handlePlaceBid} disabled={isBidding} title="Place bid" className="h-16 px-10 bg-primary text-primary-foreground font-black text-lg rounded-2xl hover:bg-primary/90 shadow-xl transition-all active:scale-95">
                        {isBidding ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Place Bid'}
                      </Button>
                    </div>
                  ) : isAuctionWinner ? (
                    <Button onClick={handleProceedCheckout} title="Complete win" className="w-full h-20 text-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl rounded-[1.5rem] transition-all active:scale-95 uppercase italic tracking-tighter">Pay Winning Bid (${Number(currentPrice + shippingCost).toLocaleString()})</Button>
                  ) : (
                    <div className="bg-zinc-50 p-8 rounded-2xl border-4 border-dashed text-center"><p className="text-zinc-400 font-black uppercase text-sm tracking-[0.2em]">Auction Protocol Concluded</p></div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={handleProceedCheckout} title="Buy it now" className="w-full h-20 text-2xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl rounded-[1.5rem] transition-all active:scale-95 uppercase italic tracking-tighter">Buy It Now</Button>
                  <Button asChild variant="outline" title="Message seller" className="w-full h-16 font-black border-2 rounded-2xl gap-3 text-lg transition-all hover:bg-primary hover:text-primary-foreground uppercase">
                    <Link href={`/messages?seller=${listing.sellerName || listing.seller}`} className="flex items-center gap-3"><MessageSquare className="w-5 h-5" /> Message Dealer</Link>
                  </Button>
                </div>
              )}
            </div>

            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-12 gap-10">
                <TabsTrigger value="description" className="font-black uppercase text-xs tracking-widest data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-12">Manifest</TabsTrigger>
                {isAuction && <TabsTrigger value="bids" className="font-black uppercase text-xs tracking-widest data-[state=active]:border-b-4 data-[state=active]:border-primary rounded-none h-12">Log ({listing.bidCount || 0})</TabsTrigger>}
              </TabsList>
              <TabsContent value="description" className="py-8 text-muted-foreground font-medium text-lg leading-relaxed italic">"{listing.description}"</TabsContent>
              {isAuction && (
                <TabsContent value="bids" className="py-8 space-y-4">
                  {bidsLoading ? (<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />) : !bidsHistory || bidsHistory.length === 0 ? (<p className="text-center text-muted-foreground italic py-8">No bid protocols detected.</p>) : (
                    <div className="space-y-3">
                      {bidsHistory.map((bid, i) => (
                        <div key={bid.id} className={cn("flex items-center justify-between p-5 rounded-2xl border-2 transition-all", i === 0 ? "bg-primary/5 border-primary/20 scale-[1.02] shadow-md" : "bg-white border-zinc-100 opacity-60")}>
                          <div className="flex items-center gap-4">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs", i === 0 ? "bg-primary text-primary-foreground" : "bg-zinc-100 text-zinc-500")}>{i + 1}</div>
                            <span className="font-black text-sm uppercase tracking-tight">@{bid.bidderName}</span>
                          </div>
                          <span className={cn("font-black text-xl italic", i === 0 ? "text-primary" : "text-zinc-400")}>${bid.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
          <DialogTitle className="sr-only">Report Integrity Issue</DialogTitle>
          <div className="bg-red-600 p-10 text-white">
            <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-white" /></div>
            <h2 className="text-3xl font-headline font-black uppercase tracking-tight leading-none">Report Issue</h2>
          </div>
          <div className="p-10 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="report-reason-select" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Violation Protocol</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="report-reason-select" className="h-14 rounded-xl border-2 font-bold text-primary"><SelectValue placeholder="Select Reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Counterfeit">Counterfeit / Fake</SelectItem>
                  <SelectItem value="Misleading">Misleading Condition</SelectItem>
                  <SelectItem value="Fraudulent">Fraudulent Dealer</SelectItem>
                  <SelectItem value="Other">Other Violation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-details-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Evidence Details</Label>
              <Textarea id="report-details-input" placeholder="Describe the violation in detail..." className="min-h-[120px] rounded-xl border-2 text-primary font-medium" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />
            </div>
            <Button onClick={() => {toast({title: "Report Sent"}); setIsReportDialogOpen(false)}} disabled={!reportReason} className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-black text-xl rounded-xl shadow-xl transition-all">Submit Violation Report</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
