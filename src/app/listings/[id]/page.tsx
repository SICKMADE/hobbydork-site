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
  Truck, 
  ArrowLeft, 
  Heart, 
  Share2, 
  Store, 
  MessageCircle, 
  Loader2,
  CreditCard,
  Lock,
  Flag,
  AlertTriangle,
  Gavel
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useDoc, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';

export default function ListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [bidAmount, setBidAmount] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const listingRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'listings', id);
  }, [db, id]);

  const bidsQuery = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'listings', id, 'bids'), orderBy('amount', 'desc'), limit(10));
  }, [db, id]);

  const { data: firestoreListing, isLoading: listingLoading } = useDoc(listingRef);
  const { data: bidsHistory, isLoading: bidsLoading } = useCollection(bidsQuery);

  const listing = firestoreListing;

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

  if (listingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!listing) return <div className="p-12 text-center text-muted-foreground font-black uppercase tracking-widest">Listing not found</div>;

  const isAuction = listing.type === 'Auction';
  const auctionEnded = isAuction && (isExpired || listing.status === 'Ended');
  const isAuctionWinner = !!(user && listing.winnerUid === user.uid && listing.paymentStatus === 'PENDING');
  const checkoutAmount = isAuction ? (listing.winningBid || listing.currentBid || listing.price) : listing.price;

  const handlePlaceBid = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Sign In Required', description: 'Please sign in to place a bid.' });
      return;
    }
    if (isExpired || listing.status === 'Ended' || listing.status === 'Sold') {
      toast({ variant: 'destructive', title: 'Auction Ended', description: 'No more bids are being accepted for this item.' });
      return;
    }

    const amount = parseFloat(bidAmount);
    const currentPrice = listing.currentBid || listing.price;
    if (isNaN(amount) || amount <= currentPrice) {
      toast({ variant: 'destructive', title: 'Invalid Bid', description: `Your bid must be higher than $${currentPrice.toLocaleString()}.` });
      return;
    }
    if (!db || !listingRef) return;

    setIsBidding(true);

    const bidData = {
      amount,
      bidderId: user.uid,
      bidderName: user.displayName || 'User',
      timestamp: serverTimestamp()
    };

    addDoc(collection(db, 'listings', id, 'bids'), bidData)
      .then(async () => {
        updateDoc(listingRef, { currentBid: amount, bidCount: increment(1) });
        toast({ title: 'Bid Placed!', description: `Successfully bid $${amount.toLocaleString()}.` });
        setBidAmount('');
        setIsBidding(false);
      })
      .catch(async (error) => {
        toast({
          variant: 'destructive',
          title: 'Bid Failed',
          description: getFriendlyErrorMessage(error)
        });
        const permissionError = new FirestorePermissionError({
          path: `listings/${id}/bids`,
          operation: 'create',
          requestResourceData: bidData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsBidding(false);
      });
  };

  const handleSubmitReport = async () => {
    if (!user || !db) return;
    setIsSubmittingReport(true);

    const reportData = {
      reporterUid: user.uid,
      reporterName: user.displayName || 'User',
      reportedId: id,
      reportedName: listing.title,
      reason: reportReason,
      details: reportDetails,
      type: 'Listing',
      status: 'PENDING',
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'reports'), reportData);
      toast({ title: "Report Submitted", description: "Moderators will review this listing shortly." });
      setIsReportDialogOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Submission Failed" });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleProceedCheckout = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!listing || !db) return;

    if (isAuction && !isAuctionWinner) {
      toast({
        variant: 'destructive',
        title: 'Winner Payment Only',
        description: 'Only the winning bidder can complete auction payment.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const amountCents = Math.round(Number(checkoutAmount) * 100);
      
      setIsCheckoutOpen(false);
      router.push(`/checkout?listing=${listing.id}&order=${orderId}&amount=${amountCents}`);
    } catch (error) {
      console.error('Order creation error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Checkout Error', 
        description: 'Failed to create order. Please try again.' 
      });
      setIsProcessing(false);
    }
  };

  const listingImageUrl = listing.imageUrl?.trim();

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs md:text-sm text-muted-foreground hover:text-primary font-bold uppercase tracking-widest text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            {user && listing.sellerId === user.uid && (
              <Link href={`/listings/${id}/edit`} className="text-muted-foreground hover:text-accent gap-2 font-black uppercase text-[9px] md:text-[10px] flex items-center">
                ✎ Edit
              </Link>
            )}
            <button 
              onClick={() => setIsReportDialogOpen(true)}
              className="text-muted-foreground hover:text-red-600 gap-2 font-black uppercase text-[9px] md:text-[10px] flex items-center"
            >
              <Flag className="w-3.5 h-3.5" /> Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12">
          <div className="space-y-4">
            <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden bg-muted/20 border shadow-sm">
              {listingImageUrl ? (
                <Image src={listingImageUrl} alt={listing.title} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/30">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Image not available</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <Badge variant="secondary" className="px-3 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{listing.category}</Badge>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 hover:bg-accent/10 hover:text-accent"><Heart className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-full w-9 h-9"><Share2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-headline font-black leading-tight uppercase text-primary tracking-tight">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <Link href={`/shop/${listing.sellerName || listing.seller}`} className="group flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 border"><Store className="w-3.5 h-3.5 text-muted-foreground" /></div>
                  <span className="text-muted-foreground font-medium">@{listing.sellerName || listing.seller}</span>
                </Link>
                <span className="text-accent flex items-center gap-1 font-black uppercase text-[9px] tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
                {listing.condition && (
                  <span className="text-muted-foreground font-medium text-[9px] tracking-widest uppercase">
                    Condition: {listing.condition}
                  </span>
                )}
              </div>
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {listing.tags.map((tag: string) => (
                    <span key={tag} className="text-[9px] px-3 py-1 bg-secondary text-secondary-foreground rounded-full font-black uppercase tracking-widest">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Separator className="opacity-50" />

            {isAuction && (
              <div className={cn(
                "p-3 md:p-4 rounded-xl flex items-center justify-between border-2 animate-in fade-in duration-500",
                isExpired ? "bg-zinc-50 border-zinc-200 text-zinc-400" : "bg-accent/5 border-accent/20 text-accent"
              )}>
                <div className="flex items-center gap-2 md:gap-3">
                  <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Remaining</span>
                </div>
                <span className="font-black text-base md:text-lg italic">{timeRemaining}</span>
              </div>
            )}

            <div className="bg-card p-6 md:p-8 rounded-xl md:rounded-2xl border shadow-xl space-y-6">
              <div className="flex justify-between items-baseline">
                <div>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">{isAuction ? 'Current Bid' : 'Price'}</p>
                  <p className="text-3xl md:text-5xl font-black text-primary">${(isAuction ? (listing.currentBid || listing.price) : listing.price).toLocaleString()}</p>
                </div>
                {isAuction && !auctionEnded && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 py-1 font-black uppercase text-[8px] tracking-widest">
                    <Gavel className="w-3 h-3 mr-1" /> {listing.bidCount || 0} Bids
                  </Badge>
                )}
              </div>

              {listing.status === 'Sold' ? (
                <div className="bg-zinc-100 dark:bg-zinc-900 p-6 rounded-xl text-center border-2 border-dashed">
                  <Badge className="bg-zinc-500 dark:bg-zinc-800 text-white mb-2 uppercase font-black">SOLD</Badge>
                  <p className="font-bold text-zinc-500 uppercase text-xs">No longer available.</p>
                </div>
              ) : isAuction ? (
                <div className="space-y-4">
                  {!auctionEnded ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                        <Input placeholder="Bid amount" className="pl-10 h-12 md:h-14 rounded-xl text-lg font-bold border-2" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                      </div>
                      <Button onClick={handlePlaceBid} disabled={isBidding} className="h-12 md:h-14 px-8 bg-accent text-white font-black rounded-xl hover:bg-accent/90 shadow-lg w-full sm:w-auto">
                        {isBidding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Place Bid'}
                      </Button>
                    </div>
                  ) : isAuctionWinner ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 p-6 rounded-xl border-2 border-green-200 text-center">
                        <p className="text-green-700 font-black uppercase text-xs tracking-widest mb-1">You won this auction</p>
                        <p className="text-green-900 font-bold">Complete payment to finalize your order.</p>
                      </div>
                      <Button onClick={() => setIsCheckoutOpen(true)} className="w-full h-14 md:h-16 text-lg md:text-xl font-black bg-accent hover:bg-accent/90 text-white shadow-xl rounded-xl transition-all">
                        Pay Winning Bid (${Number(checkoutAmount).toLocaleString()})
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 p-6 rounded-xl border-2 border-dashed text-center">
                      <p className="text-zinc-400 font-black uppercase text-xs tracking-widest">Auction concluded.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {listing.quantity && listing.quantity > 0 && (
                    <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl">
                      <p className="text-green-700 font-black uppercase text-[9px] tracking-widest mb-1">In Stock</p>
                      <p className="text-green-900 font-bold text-sm">{listing.quantity} {listing.quantity === 1 ? 'item' : 'items'} available</p>
                    </div>
                  )}
                  <Button onClick={() => setIsCheckoutOpen(true)} className="w-full h-14 md:h-16 text-lg md:text-xl font-black bg-accent hover:bg-accent/90 text-white shadow-xl rounded-xl transition-all">Buy It Now</Button>
                  {/* Condition Warning - Prominent Position */}
                  {listing.condition && (
                    <div className={cn(
                      "p-4 md:p-5 rounded-xl border-2 space-y-3 bg-yellow-50 border-yellow-400 dark:bg-yellow-950/30 dark:border-yellow-700"
                    )}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 flex-shrink-0 text-yellow-700 dark:text-yellow-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest mb-1 text-yellow-900 dark:text-yellow-100">
                            {'\u26a0\ufe0f CONDITION: RAW (UNGRADED)'}
                          </p>
                          <p className="font-black text-base md:text-lg text-yellow-900 dark:text-yellow-100">
                            {listing.condition}
                          </p>
                          {['Sports Cards', 'Comics', 'Trading Cards', 'Collectibles', 'Pokemon', 'Magic: The Gathering', 'Anime'].some(cat => listing.category?.includes(cat)) && (
                            <div className="mt-3 space-y-2 text-xs">
                              <p className="font-bold text-yellow-900 dark:text-yellow-200">
                                {'\u26a0\ufe0f '}<span className="font-black">RAW ITEMS 9/10 TIMES WON'T BE PERFECT</span> - Micro scratches, wear, and centering issues are common.
                              </p>
                              <p className="font-bold text-yellow-900 dark:text-yellow-200">
                                {'\ud83d\udca1 '}<span className="font-black">WANT PSA 10 / CGC 9.8?</span> Search for professionally graded items to guarantee the condition you need.
                              </p>
                              <p className="font-bold text-yellow-900 dark:text-yellow-200">
                                {'\u270b '}<span className="font-black">BUYER ACCEPTS AS-IS</span> - No returns based on condition. Inspect photos carefully before buying.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <Button asChild variant="outline" className="w-full h-12 md:h-14 font-black border-2 rounded-xl gap-2 hover:bg-primary/5 transition-all text-primary">
                    <Link href={`/messages?seller=${listing.sellerName || listing.seller}`}>
                      <MessageCircle className="w-4 h-4" /> Message Seller
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            <Tabs defaultValue="description" className="w-full pt-4">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-10 md:h-12 gap-6 md:gap-8">
                <TabsTrigger value="description" className="font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">Description</TabsTrigger>
                {isAuction && <TabsTrigger value="bids" className="font-black uppercase text-[9px] md:text-[10px] tracking-widest data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none">Bid History</TabsTrigger>}
              </TabsList>
              <TabsContent value="description" className="py-4 md:py-6 text-sm md:text-base text-muted-foreground font-medium">
                <p className="leading-relaxed">{listing.description}</p>
              </TabsContent>
              {isAuction && (
                <TabsContent value="bids" className="py-4 md:py-6 space-y-4">
                  {bidsLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
                  ) : !bidsHistory || bidsHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground text-xs md:text-sm italic py-8">No bids placed yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {bidsHistory.map((bid, i) => (
                        <div key={bid.id} className={cn(
                          "flex items-center justify-between p-3 md:p-4 rounded-xl border",
                          i === 0 ? "bg-accent/5 border-accent/20" : "bg-white"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-black text-[9px] md:text-[10px]",
                              i === 0 ? "bg-accent text-white" : "bg-zinc-100 text-zinc-500"
                            )}>{i + 1}</div>
                            <span className="font-bold text-xs md:text-sm">@{bid.bidderName}</span>
                          </div>
                          <span className={cn("font-black text-sm md:text-base", i === 0 ? "text-accent" : "text-primary")}>${bid.amount.toLocaleString()}</span>
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

      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <DialogTitle className="sr-only">Checkout</DialogTitle>
          <div className="bg-card text-foreground">
            <div className="bg-primary p-8 text-primary-foreground">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-accent/20 p-3 rounded-2xl">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
              </div>
              <h2 className="text-3xl font-headline font-black italic mb-2 tracking-tight">Checkout</h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-dashed border-muted-foreground/20">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Item</p>
                  <p className="font-black text-lg">{listing?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Price</p>
                  <p className="font-black text-2xl text-accent">${Number(checkoutAmount).toLocaleString()}</p>
                </div>
              </div>
              <Button onClick={handleProceedCheckout} disabled={isProcessing} className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-black rounded-xl disabled:opacity-50">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Order...
                  </>
                ) : (
                  'Proceed to Checkout'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[1.5rem] md:rounded-[2rem] shadow-2xl">
          <DialogTitle className="sr-only">Report Listing</DialogTitle>
          <div className="bg-white text-zinc-900">
            <div className="bg-red-600 p-6 md:p-8 text-white">
              <div className="bg-white/20 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tight leading-none">Report</h2>
            </div>
            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Reason</Label>
                <Select value={reportReason} onValueChange={setReportReason}>
                  <SelectTrigger className="h-12 md:h-14 rounded-xl border-2 font-bold text-primary">
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Counterfeit">Counterfeit / Fake</SelectItem>
                    <SelectItem value="Misleading">Misleading Description</SelectItem>
                    <SelectItem value="Fraudulent">Fraudulent Listing</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Details</Label>
                <Textarea 
                  placeholder="Tell us why..." 
                  className="min-h-[100px] md:min-h-[120px] rounded-xl border-2 text-primary" 
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSubmitReport}
                disabled={!reportReason || isSubmittingReport}
                className="w-full h-14 md:h-16 bg-red-600 hover:bg-red-700 text-white font-black text-lg md:text-xl rounded-xl shadow-xl transition-all"
              >
                {isSubmittingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
