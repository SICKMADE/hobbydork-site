'use client';

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Clock,
  Truck, 
  Package, 
  CheckCircle2, 
  MapPin, 
  ArrowLeft, 
  ShieldCheck, 
  Star, 
  Loader2, 
  Home as HomeIcon,
  Gift,
  ShieldAlert,
  XCircle,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  Zap,
  Hammer,
  FileText,
  ExternalLink,
  Printer,
  Sparkles,
  Lock,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function OrderTracking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();
  const functions = typeof window !== 'undefined' ? getFunctions() : undefined;
  const { user } = useUser();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);

  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('/defaultbroken.jpg');

  const orderRef = useMemoFirebase(() => id && db ? doc(db, 'orders', id) : null, [db, id]);
  const { data: order, isLoading: loading } = useDoc(orderRef);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'Confirmed') setCurrentStep(1);
    else if (order.status === 'Processing') setCurrentStep(2);
    else if (order.status === 'Shipped') setCurrentStep(3);
    else if (order.status === 'Delivered') setCurrentStep(4);
    else if (order.status?.startsWith('Return')) setCurrentStep(4);
    
    if (order.imageUrl) {
      setImgSrc(order.imageUrl);
    }
  }, [order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!order) return <div className="p-20 text-center font-black">Order not found</div>;

  const isBuyer = user?.uid === order.buyerUid;
  const isSeller = user?.uid === order.sellerUid;

  const STEPS = [
    { id: 1, label: 'Confirmed', icon: CheckCircle2 },
    { id: 2, label: 'Processing', icon: Package },
    { id: 3, label: 'Shipped', icon: Truck },
    { id: 4, label: 'Delivered', icon: HomeIcon },
  ];

  const progressWidthClass =
    currentStep <= 1 ? 'w-0' :
    currentStep === 2 ? 'w-1/3' :
    currentStep === 3 ? 'w-2/3' :
    'w-full';

  const progressLeftClass =
    currentStep <= 1 ? 'left-0' :
    currentStep === 2 ? 'left-1/3' :
    currentStep === 3 ? 'left-2/3' :
    'left-full';

  const handleUpdateStatus = async (newStatus: string) => {
    if (!functions) return;
    setIsProcessingAction(true);
    
    try {
      const updateStatus = httpsCallable(functions, 'updateOrderStatus');
      await updateStatus({ 
        orderId: id, 
        updates: { status: newStatus }
      });
      toast({ title: `Order Status: ${newStatus}` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: getFriendlyErrorMessage(error) });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!functions) return;
    setIsProcessingAction(true);
    
    try {
      const cancelOrder = httpsCallable(functions, 'cancelLateOrder');
      await cancelOrder({ orderId: id });
      toast({ title: 'Order Cancelled', description: 'Full refund has been processed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Cancellation Failed', description: getFriendlyErrorMessage(error) });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleGenerateLabel = async () => {
    if (!db || !orderRef) return;
    setIsGeneratingLabel(true);

    try {
      const toAddress = {
        name: order.buyerName || 'Buyer',
        street1: order.shippingAddress?.street || order.shippingAddress?.line1 || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        zip: order.shippingAddress?.zip || order.shippingAddress?.postalCode || '',
        country: order.shippingAddress?.country || 'US',
      };

      const parcel = {
        length: String(order.length || '10'),
        width: String(order.width || '8'),
        height: String(order.height || '4'),
        weight: String(order.weight || '1'),
        distance_unit: 'in',
        mass_unit: 'lb',
      };

      const response = await fetch('/api/shippo/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          toAddress,
          parcel,
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate shipping label');
      }
      
      if (data.tracking_number && functions) {
        const updateStatus = httpsCallable(functions, 'updateOrderStatus');
        await updateStatus({
          orderId: id,
          updates: {
            trackingNumber: data.tracking_number,
            shippingLabelUrl: data.label_url,
            carrier: data.carrier,
            status: 'Shipped'
          }
        });
        toast({ title: "Shippo Label Generated" });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Shipping Error", description: e.message });
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!db || !user || !order) return;
    setIsSubmittingReview(true);

    const reviewData = {
      rating,
      buyerId: user.uid,
      buyerName: user.displayName || 'Collector',
      sellerId: order.sellerUid,
      listingId: order.listingId,
      listingTitle: order.listingTitle,
      comment,
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'reviews'), reviewData);
      setHasReviewed(true);
      setIsSubmittingReview(false);
      setIsReviewOpen(false);
      toast({ title: 'Feedback Shared!' });
    } catch (error) {
      toast({ variant: 'destructive', title: "Review Failed" });
      setIsSubmittingReview(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!db || !user || !order || !returnReason.trim() || !functions) return;
    setIsProcessingReturn(true);

    try {
      const updateStatus = httpsCallable(functions, 'updateOrderStatus');
      
      if (order.status === 'Return Approved') {
        await updateStatus({
          orderId: id,
          updates: {
            status: 'Return Shipped',
            returnTrackingNumber: returnReason
          }
        });
        toast({ title: 'Return Shipped' });
      } else {
        const returnId = `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await addDoc(collection(db, 'returns'), {
          returnId,
          orderId: id,
          buyerUid: user.uid,
          reason: returnReason,
          status: 'Return Requested',
          amount: order.price,
          createdAt: serverTimestamp(),
        });
        await updateStatus({ orderId: id, updates: { status: 'Return Requested', returnId } });
        toast({ title: 'Return Requested' });
      }
      setIsReturnDialogOpen(false);
      setReturnReason('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Action Failed' });
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const isGiveaway = order.type === 'Giveaway' || order.price === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <header className="mb-12 space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent font-black tracking-widest text-[10px] uppercase">
                <Truck className="w-3 h-3" /> Delivery Tracking
              </div>
              <h1 className="text-4xl font-headline font-black uppercase tracking-tighter leading-none">
                {isGiveaway ? 'Track Your Prize' : 'Track Your Order'}
              </h1>
              <p className="text-muted-foreground font-medium">Order ID: <span className="text-primary font-black">#{id.substring(0, 8).toUpperCase()}</span></p>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className={cn(
                "h-10 px-6 border-2 font-black uppercase text-[10px] tracking-widest bg-white",
                order.status === 'Cancelled' && "text-red-600 border-red-200 bg-red-50",
                order.status === 'Disputed' && "text-amber-600 border-amber-200 bg-amber-50",
                order.status === 'Delivered' && "text-green-600 border-green-200 bg-green-50"
              )}>
                {order.status || 'Confirmed'}
              </Badge>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
          <div className="space-y-8">
            {isBuyer && order.buyerCanCancel && order.status !== 'Shipped' && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
              <Card className="bg-red-600 text-white border-none shadow-2xl p-8 rounded-[2rem] animate-in zoom-in duration-500">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-3 rounded-full shrink-0">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-headline font-black uppercase tracking-tight">Late Shipping Protection</h3>
                      <p className="font-bold text-white/90">The seller has missed the mandatory 2-business-day shipping window.</p>
                    </div>
                    <Button 
                      onClick={handleCancelOrder}
                      disabled={isProcessingAction}
                      className="bg-white text-red-600 hover:bg-white/90 font-black h-14 rounded-xl px-8 shadow-xl uppercase text-sm w-full sm:w-auto"
                    >
                      {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Cancel Order & Get Refund
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-10 space-y-16">
                <div className="relative pt-12">
                   <div className="absolute top-1/2 left-0 right-0 h-2 bg-muted rounded-full -translate-y-1/2" />
                   <div className={cn("absolute top-1/2 left-0 h-2 bg-accent rounded-full -translate-y-1/2 transition-all duration-1000", progressWidthClass)} />
                   <div className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-[85%] transition-all duration-1000 z-20", progressLeftClass)}>
                     <div className="bg-accent text-white p-3 rounded-xl shadow-lg">
                        {isGiveaway ? <Gift className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
                     </div>
                   </div>
                   <div className="relative flex justify-between">
                     {STEPS.map((step) => (
                       <div key={step.id} className="flex flex-col items-center gap-4 z-10">
                          <div className={cn("w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500", currentStep >= step.id ? "bg-accent border-accent text-white shadow-lg" : "bg-white border-muted text-muted-foreground")}>
                            <step.icon className="w-5 h-5" />
                          </div>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest text-center max-w-[80px]", currentStep >= step.id ? "text-primary" : "text-muted-foreground")}>{step.label}</span>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="pt-8">
                  {isSeller && (
                    <div className="bg-zinc-950 text-white p-8 rounded-2xl space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-accent" />
                          <h3 className="font-black uppercase text-sm tracking-widest">Dealer Control Panel</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {order.status === 'Confirmed' && (
                          <Button onClick={() => handleUpdateStatus('Processing')} className="bg-accent text-white h-14 rounded-xl font-black uppercase text-xs" disabled={isProcessingAction}>Start Processing</Button>
                        )}
                        {order.status === 'Processing' && !order.trackingNumber && (
                          <Button onClick={handleGenerateLabel} className="bg-accent text-white h-14 rounded-xl font-black uppercase text-xs" disabled={isGeneratingLabel}>
                            {isGeneratingLabel ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />} Generate Label
                          </Button>
                        )}
                        {order.status === 'Processing' && order.trackingNumber && (
                          <Button onClick={() => handleUpdateStatus('Shipped')} className="bg-green-600 text-white h-14 rounded-xl font-black uppercase text-xs" disabled={isProcessingAction}>Mark as Shipped</Button>
                        )}
                      </div>
                      {order.trackingNumber && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active Tracking</p>
                            <code className="text-sm font-mono text-red-400 font-bold">{order.trackingNumber}</code>
                          </div>
                          <Badge variant="outline" className="border-red-400/30 text-red-400 uppercase font-black text-[8px]">{order.carrier || 'Carrier'}</Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {isBuyer && order.status === 'Delivered' && !hasReviewed && (
                    <div className="bg-accent/5 border-2 border-dashed border-accent/20 p-8 rounded-2xl flex flex-col items-center text-center space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black uppercase tracking-tight italic">Package Received</h3>
                        <p className="text-sm text-muted-foreground font-medium italic">Help the community by rating @{order.sellerName}.</p>
                      </div>
                      <div className="flex gap-3 w-full max-w-xs">
                        <Button onClick={() => setIsReviewOpen(true)} className="flex-1 bg-accent text-white font-black rounded-xl h-14 uppercase text-xs">Rate Seller</Button>
                        <Button variant="outline" onClick={() => setIsReturnDialogOpen(true)} className="flex-1 rounded-xl h-14 font-black border-2 text-xs">Return</Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-8">
            <Card className="border-none shadow-2xl bg-zinc-950 text-white rounded-[2rem] overflow-hidden">
               <CardHeader className="p-8 pb-0">
                 <h3 className="text-xl font-headline font-black uppercase tracking-tighter italic">Manifest</h3>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                     <Image 
                        src={imgSrc} 
                        alt={order.listingTitle} 
                        fill 
                        className="object-cover" 
                        onError={() => setImgSrc('/defaultbroken.jpg')}
                      />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Asset Title</p>
                     <h4 className="text-2xl font-black leading-tight tracking-tight">{order.listingTitle}</h4>
                     <p className="text-sm font-bold text-accent">${order.price?.toLocaleString()}</p>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isBuyer ? 'Seller' : 'Buyer'}</p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">{(isBuyer ? order.sellerName : order.buyerName)?.[0] || '?'}</div>
                        <p className="text-sm font-black uppercase tracking-tight">@{isBuyer ? order.sellerName : order.buyerName}</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <div className="bg-primary p-8 text-white">
             <h2 className="text-3xl font-headline font-black uppercase tracking-tight italic">Rate Experience</h2>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} title={`Rate ${s} stars`} aria-label={`Rate ${s} stars`} onClick={() => setRating(s)} className="transition-transform active:scale-90">
                  <Star className={cn("w-10 h-10", s <= rating ? "text-yellow-500 fill-current" : "text-muted")} />
                </button>
              ))}
            </div>
            <Textarea placeholder="Share your experience..." className="min-h-[120px] rounded-xl border-2 font-medium" value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button onClick={handleReviewSubmit} disabled={isSubmittingReview} className="w-full bg-accent text-white font-black rounded-xl h-16 shadow-lg uppercase text-sm">Post Review</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
          <div className="bg-red-600 p-8 text-white">
             <h2 className="text-3xl font-headline font-black uppercase tracking-tight italic">Return Protocol</h2>
          </div>
          <div className="p-8 space-y-6">
            <Label className="text-[10px] font-black uppercase tracking-widest">{order.status === 'Return Approved' ? 'Carrier Tracking' : 'Reason for Return'}</Label>
            <Textarea placeholder="Describe the issue..." className="min-h-[120px] rounded-xl border-2 font-medium" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
            <Button onClick={handleReturnSubmit} disabled={isProcessingReturn || !returnReason.trim()} className="w-full bg-red-600 text-white font-black rounded-xl h-16 uppercase text-sm">Confirm Protocol</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
