'use client';

import { use, useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function OrderTracking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const db = useFirestore();
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
  const [returnData, setReturnData] = useState<any>(null);

  const orderRef = useMemoFirebase(() => id && db ? doc(db, 'orders', id) : null, [db, id]);
  const { data: order, isLoading: loading } = useDoc(orderRef);

  useEffect(() => {
    if (!order) return;
    if (order.status === 'Confirmed') setCurrentStep(1);
    else if (order.status === 'Processing') setCurrentStep(2);
    else if (order.status === 'Shipped') setCurrentStep(3);
    else if (order.status === 'Delivered') setCurrentStep(4);
    else if (order.status === 'Return Requested') setCurrentStep(4);
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
    if (!db || !orderRef) return;
    setIsProcessingAction(true);
    
    updateDoc(orderRef, { status: newStatus, updatedAt: serverTimestamp() })
      .then(() => {
        toast({ title: `Order ${newStatus}` });
        setIsProcessingAction(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: orderRef.path,
          operation: 'update',
          requestResourceData: { status: newStatus },
        } satisfies SecurityRuleContext));
        setIsProcessingAction(false);
      });
  };

  const handleGenerateLabel = async () => {
    if (!db || !orderRef) return;
    setIsGeneratingLabel(true);

    try {
      const toAddress = {
        name: order.buyerName || 'Buyer',
        street1: order.shippingAddress?.street || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        zip: order.shippingAddress?.zip || '',
        country: order.shippingAddress?.country || 'US',
      };

      const response = await fetch('/api/shippo/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          listingId: order.listingId,
          buyerId: order.buyerUid,
          toAddress,
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate shipping label');
      }
      
      if (data.tracking_number) {
        await updateDoc(orderRef, {
          trackingNumber: data.tracking_number,
          labelUrl: data.label_url,
          carrier: data.carrier,
          status: 'Shipped',
          updatedAt: serverTimestamp()
        });
        toast({ title: "Shippo Label Generated", description: "Tracking number updated and label is ready." });
      }
    } catch (e) {
      toast({ variant: 'destructive', title: "Shippo Error", description: "Failed to connect to shipping provider." });
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleOpenDispute = async () => {
    if (!db || !user || !order || !disputeReason) return;
    setIsProcessingAction(true);

    const reportData = {
      reporterUid: user.uid,
      reporterName: user.displayName || 'User',
      reportedId: id,
      reportedName: `Order Dispute: ${order.listingTitle}`,
      reason: 'Order Dispute',
      details: disputeReason,
      type: 'Order',
      status: 'PENDING',
      timestamp: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'reports'), reportData);
      await updateDoc(orderRef!, { status: 'Disputed', updatedAt: serverTimestamp() });
      toast({ title: "Dispute Opened", description: "A moderator will review this transaction shortly." });
      setIsDisputeOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Failed to open dispute" });
    } finally {
      setIsProcessingAction(false);
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
      toast({ title: 'Feedback Shared!', description: 'Your review helps the community.' });
    } catch (error) {
      toast({ variant: 'destructive', title: "Review Failed" });
      setIsSubmittingReview(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!db || !user || !order || !returnReason.trim() || !orderRef) return;
    setIsProcessingReturn(true);

    try {
      // If return is already approved, just mark as shipped
      if (order.status === 'Return Approved') {
        await updateDoc(orderRef!, { 
          status: 'Return Shipped', 
          returnTrackingNumber: returnReason,
          updatedAt: serverTimestamp() 
        });
        toast({ title: 'Return Shipped', description: 'The seller has been notified. Awaiting confirmation of receipt.' });
      } else {
        // Otherwise, create a new return request
        const returnId = `return_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const returnRequestData = {
          returnId,
          orderId: id,
          buyerUid: user.uid,
          buyerName: user.displayName || 'Buyer',
          sellerUid: order.sellerUid,
          sellerName: order.sellerName,
          listingId: order.listingId,
          listingTitle: order.listingTitle,
          reason: returnReason,
          status: 'Return Requested',
          amount: order.price,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'returns'), returnRequestData);
        await updateDoc(orderRef!, { status: 'Return Requested', returnId, updatedAt: serverTimestamp() });
        
        toast({ title: 'Return Requested', description: 'The seller has been notified. Awaiting approval...' });
        setReturnData(returnRequestData);
      }
      
      setIsReturnDialogOpen(false);
      setReturnReason('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Return Request Failed' });
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!user || !order) return;
    setIsProcessingAction(true);

    try {
      const processRefund = httpsCallable(functions, 'processRefund');
      const result = await processRefund({ orderId: id });
      
      toast({ title: 'Refund Processed', description: 'Refund has been sent to the buyer.' });
    } catch (error: any) {
      console.error('Refund error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Refund Failed',
        description: error.message || 'Could not process refund. Please try again.'
      });
    } finally {
      setIsProcessingAction(false);
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
            <Card className="border-none shadow-2xl bg-card rounded-[2rem] overflow-hidden">
              <CardContent className="p-10 space-y-16">
                <div className="relative pt-12">
                   <div className="absolute top-1/2 left-0 right-0 h-2 bg-muted rounded-full -translate-y-1/2" />
                   <div 
                     className={cn(
                       "absolute top-1/2 left-0 h-2 bg-accent rounded-full -translate-y-1/2 transition-all duration-1000 ease-in-out",
                       progressWidthClass
                     )}
                   />
                   <div 
                     className={cn(
                       "absolute top-1/2 -translate-x-1/2 -translate-y-[85%] transition-all duration-1000 ease-in-out z-20",
                       progressLeftClass
                     )}
                   >
                     <div className="bg-accent text-white p-3 rounded-xl shadow-lg">
                        {isGiveaway ? <Gift className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
                     </div>
                   </div>

                   <div className="relative flex justify-between">
                     {STEPS.map((step) => {
                       const isCompleted = currentStep >= step.id;
                       return (
                         <div key={step.id} className="flex flex-col items-center gap-4 z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500",
                              isCompleted ? "bg-accent border-accent text-white shadow-lg" : "bg-white border-muted text-muted-foreground"
                            )}>
                              <step.icon className="w-5 h-5" />
                            </div>
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest text-center max-w-[80px]",
                              isCompleted ? "text-primary" : "text-muted-foreground"
                            )}>{step.label}</span>
                         </div>
                       );
                     })}
                   </div>
                </div>

                <div className="pt-8">
                  {isSeller && (
                    <div className="bg-zinc-950 text-white p-8 rounded-2xl space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-accent" />
                          <h3 className="font-black uppercase text-sm tracking-widest">Dealer Control</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-accent" />
                          <span className="text-[9px] font-black uppercase text-accent tracking-widest">Must Ship in 48h</span>
                        </div>
                      </div>

                      {/* Status Progression Buttons */}
                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                          <Truck className="w-3 h-3" /> Order Status
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {order.status === 'Confirmed' && (
                            <Button 
                              onClick={() => handleUpdateStatus('Processing')}
                              className="bg-accent text-white hover:bg-accent/90 h-12 rounded-lg font-black uppercase text-[9px] col-span-2"
                              disabled={isProcessingAction}
                            >
                              {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                              Start Processing
                            </Button>
                          )}
                          
                          {order.status === 'Processing' && (
                            <Button 
                              onClick={handleGenerateLabel}
                              className="bg-accent text-white hover:bg-accent/90 h-12 rounded-lg font-black uppercase text-[9px]"
                              disabled={isGeneratingLabel}
                            >
                              {isGeneratingLabel ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
                              Gen Label
                            </Button>
                          )}

                          {order.status === 'Processing' && order.trackingNumber && (
                            <Button 
                              onClick={() => handleUpdateStatus('Shipped')}
                              className="bg-green-600 text-white hover:bg-green-700 h-12 rounded-lg font-black uppercase text-[9px]"
                              disabled={isProcessingAction}
                            >
                              {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Truck className="w-4 h-4 mr-2" />}
                              Mark Shipped
                            </Button>
                          )}

                          {(order.status === 'Confirmed' || order.status === 'Processing') && (
                            <Button 
                              variant="outline" 
                              onClick={() => handleUpdateStatus('Cancelled')} 
                              className="border-white/20 text-white hover:bg-red-600 hover:border-red-600 h-12 rounded-lg font-black uppercase text-[9px]"
                              disabled={isProcessingAction}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Label Generation */}
                      {order.status !== 'Shipped' && order.status !== 'Delivered' && !order.trackingNumber && (
                        <Button 
                          onClick={handleGenerateLabel} 
                          className="w-full bg-accent text-white hover:bg-accent/90 h-14 rounded-xl font-black uppercase gap-2"
                          disabled={isGeneratingLabel}
                        >
                          {isGeneratingLabel ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                          Generate Shippo Label
                        </Button>
                      )}

                      {order.trackingNumber && (
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tracking Info</p>
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-cyan-400 font-bold">{order.trackingNumber}</code>
                            <Badge variant="outline" className="border-cyan-400/30 text-cyan-400 text-[8px]">{order.carrier || 'USPS'}</Badge>
                          </div>
                        </div>
                      )}

                      <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Dealer fulfillment tip
                        </h4>
                        <p className="text-xs font-bold leading-relaxed text-zinc-400 italic">
                          "Shipping within 48 hours is mandatory. Prompt fulfillment boosts your feedback rating and ensures your listings get priority visibility on the home page."
                        </p>
                      </div>

                      {order.status === 'Return Requested' && (
                        <div className="bg-orange-950 border border-orange-900/50 p-6 rounded-xl space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-400 flex items-center gap-2">
                            <RotateCcw className="w-3 h-3" /> Return Request
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-[9px] text-orange-400/70 uppercase font-bold tracking-wide mb-1">Buyer's Reason:</p>
                              <p className="text-sm text-orange-100 font-medium">{returnData?.reason || 'Return request pending...'}</p>
                            </div>
                            <div className="flex gap-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    onClick={() => handleUpdateStatus('Return Approved')}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 h-12 rounded-lg font-black uppercase text-[9px]"
                                    disabled={isProcessingAction}
                                  >
                                    {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Approve Return
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs font-bold">Approve the return and buyer will ship item back</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    onClick={() => handleUpdateStatus('Delivered')}
                                    className="flex-1 bg-red-600 text-white hover:bg-red-700 h-12 rounded-lg font-black uppercase text-[9px]"
                                    disabled={isProcessingAction}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deny
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs font-bold">Reject return request and order stays completed</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.status === 'Return Requested' && (
                        <div className="bg-orange-950/50 border border-orange-900/30 p-6 rounded-xl space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-300 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Return Best Practices
                          </h4>
                          <ul className="space-y-2 text-[11px] text-orange-200/80 font-medium">
                            <li className="flex gap-2">
                              <span className="text-orange-400 font-black">→</span>
                              <span><strong>Accept returns</strong> to protect your seller rating and maintain buyer trust</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-orange-400 font-black">→</span>
                              <span><strong>Fast refunds</strong> often result in positive feedback even for returns</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-orange-400 font-black">→</span>
                              <span><strong>Disputed returns</strong> can impact your tier status and search visibility</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-orange-400 font-black">→</span>
                              <span><strong>Communicate</strong> return address details promptly via messages</span>
                            </li>
                          </ul>
                        </div>
                      )}

                      {order.status === 'Return Shipped' && (
                        <div className="bg-blue-950 border border-blue-900/50 p-6 rounded-xl space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                            <Truck className="w-3 h-3" /> Item Return Shipping
                          </h4>
                          <p className="text-sm text-blue-100 font-medium">The buyer has shipped the item back. Awaiting receipt.</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                onClick={handleProcessRefund}
                                className="w-full bg-green-600 text-white hover:bg-green-700 h-12 rounded-lg font-black uppercase text-[9px]"
                                disabled={isProcessingAction}
                              >
                                {isProcessingAction ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Confirm Received & Process Refund
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-bold">Verify item received and issue refund immediately via Stripe</TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {order.status === 'Return Shipped' && (
                        <div className="bg-blue-950/50 border border-blue-900/30 p-6 rounded-xl space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Refund Best Practices
                          </h4>
                          <ul className="space-y-2 text-[11px] text-blue-200/80 font-medium">
                            <li className="flex gap-2">
                              <span className="text-blue-400 font-black">→</span>
                              <span><strong>Process immediately</strong> when item is received for best buyer experience</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-blue-400 font-black">→</span>
                              <span><strong>Quick refunds</strong> often convert returns into positive 5-star reviews</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-blue-400 font-black">→</span>
                              <span><strong>Buyer retention</strong> is 2x higher when refunds are handled smoothly</span>
                            </li>
                            <li className="flex gap-2">
                              <span className="text-blue-400 font-black">→</span>
                              <span><strong>Your reputation</strong> is worth more than any single sale</span>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {isBuyer && (
                    <div className="space-y-6">
                      {order.trackingNumber && (
                        <div className="bg-zinc-950 text-white p-8 rounded-2xl space-y-4">
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-accent" />
                            <h3 className="font-black uppercase text-sm tracking-widest">In Transit</h3>
                          </div>
                          <p className="text-xs font-bold text-zinc-400 uppercase">Tracking Number: <span className="text-white ml-2">{order.trackingNumber}</span></p>
                          <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 h-12 rounded-xl font-black uppercase text-[10px] gap-2">
                            <Link href="#">Track on Carrier Website <ExternalLink className="w-3 h-3" /></Link>
                          </Button>
                        </div>
                      )}

                      {order.status === 'Confirmed' && (
                        <div className="bg-zinc-50 p-8 rounded-2xl border-2 border-dashed flex flex-col items-center gap-4 text-center">
                          <h3 className="font-black uppercase text-sm">Change of heart?</h3>
                          <p className="text-xs text-muted-foreground font-medium">You can cancel your order before the seller begins processing it.</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                onClick={() => handleUpdateStatus('Cancelled')}
                                className="rounded-xl font-bold gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                disabled={isProcessingAction}
                              >
                                <XCircle className="w-4 h-4" /> Cancel Order
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-bold">Cancel before seller starts processing for full refund</TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {order.status === 'Shipped' && (
                        <div className="bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed p-8 rounded-2xl text-center space-y-4">
                          <div className="flex items-center justify-center gap-2">
                            <Truck className="w-5 h-5 text-accent" />
                            <h3 className="text-lg font-black uppercase tracking-tighter">On Its Way</h3>
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">Tracking your package automatically. You'll be notified when delivered.</p>
                          <p className="text-xs text-muted-foreground italic">Delivery status updates automatically from the carrier.</p>
                        </div>
                      )}

                      {order.status === 'Delivered' && !hasReviewed && (
                        <div className="bg-accent/5 border-2 border-dashed border-accent/20 p-8 rounded-2xl flex flex-col items-center text-center space-y-4">
                          <div className="bg-accent/10 p-4 rounded-full"><CheckCircle2 className="w-8 h-8 text-accent" /></div>
                          <h3 className="text-xl font-black uppercase tracking-tighter">✓ Carrier Delivered</h3>
                          <p className="text-sm text-muted-foreground font-medium max-w-sm">
                            {order.carrierDeliveryDate ? `Package confirmed delivered on ${new Date(order.carrierDeliveryDate).toLocaleDateString()}` : 'Your package has been delivered.'}
                          </p>
                          <p className="text-xs text-muted-foreground italic">Help the community by rating your experience with @{order.sellerName}.</p>
                          <div className="flex gap-3">
                            <Button onClick={() => setIsReviewOpen(true)} className="bg-accent text-white font-black rounded-xl px-10 h-14 uppercase tracking-widest shadow-lg">Rate Seller</Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => setIsReturnDialogOpen(true)} className="rounded-xl h-14 px-6 font-bold border-2 gap-2"><RotateCcw className="w-4 h-4" /> Request Return</Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-bold">Start return process if item not as described or damaged</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      )}

                      {order.status === 'Return Requested' && (
                        <div className="bg-orange-50 border-2 border-orange-200 p-8 rounded-2xl space-y-4">
                          <div className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-orange-600" />
                            <h3 className="text-lg font-black uppercase tracking-tighter text-orange-700">Return Requested</h3>
                          </div>
                          <p className="text-sm text-orange-700 font-medium">Your return request has been sent to the seller. They will review it shortly.</p>
                          <p className="text-xs text-orange-600 italic">You'll receive a notification once they approve or deny your request.</p>
                        </div>
                      )}

                      {order.status === 'Return Approved' && (
                        <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-2xl space-y-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-black uppercase tracking-tighter text-blue-700">Return Approved</h3>
                          </div>
                          <p className="text-sm text-blue-700 font-medium">Great! The seller approved your return. Please package and ship the item back.</p>
                          <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-2">
                            <p className="text-xs font-bold text-blue-900 uppercase">Return Address (to be provided by seller):</p>
                            <p className="text-xs text-blue-700 font-medium">Check your messages for return shipping instructions.</p>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={() => setIsReturnDialogOpen(true)} variant="outline" className="w-full rounded-xl h-12 font-black border-blue-200 gap-2">
                                <Truck className="w-4 h-4" /> Mark as Shipped Back
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-bold">Provide tracking number for return shipment</TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      {order.status === 'Return Shipped' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 p-8 rounded-2xl space-y-4">
                          <div className="flex items-center gap-2">
                            <Truck className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-black uppercase tracking-tighter text-blue-700">Item On Way Back</h3>
                          </div>
                          <p className="text-sm text-blue-700 font-medium">The seller has received your return shipment. They'll verify the item and process your refund.</p>
                          <p className="text-xs text-blue-600 italic">Refunds typically process within 3-5 business days.</p>
                        </div>
                      )}

                      {order.status === 'Refunded' && (
                        <div className="bg-green-50 border-2 border-green-200 p-8 rounded-2xl space-y-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-black uppercase tracking-tighter text-green-700">Refund Processed</h3>
                          </div>
                          <p className="text-sm text-green-700 font-medium">${order.price?.toFixed(2)} has been refunded to your account.</p>
                          <p className="text-xs text-green-600 italic">Please allow 3-5 business days for the funds to appear in your account.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {hasReviewed && (
                    <div className="bg-green-50 border-2 border-dashed border-green-200 p-8 rounded-2xl text-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                      <p className="text-green-900 font-black uppercase tracking-widest text-sm">Review Submitted!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm bg-card p-6 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-3 rounded-xl"><MapPin className="w-6 h-6 text-accent" /></div>
                    <h4 className="font-black text-sm uppercase">Destination</h4>
                 </div>
                 <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase">
                   Verified Shipping Address<br />
                   {order.shippingAddress?.street || 'TBD'}<br />
                   {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
                 </p>
              </Card>
              <Card className="border-none shadow-sm bg-card p-6 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="bg-accent/10 p-3 rounded-xl"><ShieldAlert className="w-6 h-6 text-accent" /></div>
                    <h4 className="font-black text-sm uppercase">Order Management</h4>
                 </div>
                 <div className="space-y-2">
                    <Button 
                      variant="link" 
                      onClick={() => setIsDisputeOpen(true)}
                      className="p-0 h-auto text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1.5" />
                      Open Dispute
                    </Button>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase leading-tight">
                      Disputes are handled by the staff moderation team. Ensure you have messaged the {isBuyer ? 'seller' : 'buyer'} first.
                    </p>
                 </div>
              </Card>
            </div>
          </div>

          <aside className="space-y-8">
            <Card className="border-none shadow-2xl bg-zinc-950 text-white rounded-[2rem] overflow-hidden">
               <CardHeader className="p-8 pb-0">
                 <h3 className="text-xl font-headline font-black uppercase tracking-tighter">Order Summary</h3>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                     {order.imageUrl ? (
                       <Image src={order.imageUrl} alt={order.listingTitle} fill className="object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <Package className="w-16 h-16" />
                       </div>
                     )}
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                       {isGiveaway ? 'Prize' : 'Item'}
                     </p>
                     <h4 className="text-2xl font-black leading-tight">{order.listingTitle}</h4>
                     <p className="text-sm font-bold text-accent">
                       {isGiveaway ? 'Free Prize' : `Total Paid: $${order.price?.toLocaleString()}`}
                     </p>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{isBuyer ? 'Seller' : 'Buyer'} Details</p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">
                          {(isBuyer ? order.sellerName : (order.buyerName || 'Collector'))?.[0] || '?'}
                        </div>
                        <div>
                           <p className="text-sm font-black">@{isBuyer ? order.sellerName : (order.buyerName || 'Collector')}</p>
                           <Button asChild variant="link" className="p-0 h-auto text-[10px] text-zinc-500 font-bold uppercase tracking-widest hover:text-white">
                             <Link href={`/messages/${[order.buyerUid, order.sellerUid].sort().join('_')}`} className="flex items-center gap-1.5">
                               <MessageSquare className="w-3 h-3" /> Send Message
                             </Link>
                           </Button>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
          <div className="bg-primary p-8 text-white">
             <h2 className="text-3xl font-headline font-black uppercase tracking-tight">Review Seller</h2>
             <p className="text-white/60 text-sm font-medium">Rate your experience with this transaction.</p>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" title={`Rate ${s} star${s > 1 ? 's' : ''}`} aria-label={`Rate ${s} star${s > 1 ? 's' : ''}`} onClick={() => setRating(s)} className="transition-transform active:scale-90">
                  <Star className={cn("w-10 h-10", s <= rating ? "text-yellow-500 fill-current" : "text-muted")} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Feedback</Label>
              <Textarea 
                placeholder="Was the item as described? Was the seller reliable?" 
                className="min-h-[120px] rounded-xl border-2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setIsReviewOpen(false)} className="flex-1 rounded-xl h-14 font-black">Cancel</Button>
              <Button 
                onClick={handleReviewSubmit} 
                disabled={isSubmittingReview}
                className="flex-1 bg-accent text-white font-black rounded-xl h-14 shadow-lg"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDisputeOpen} onOpenChange={setIsDisputeOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
          <div className="bg-red-600 p-8 text-white">
             <h2 className="text-3xl font-headline font-black uppercase tracking-tight">Open Dispute</h2>
             <p className="text-white/70 text-sm font-medium">This will alert the platform staff to mediate.</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Reason for Dispute</Label>
              <Textarea 
                placeholder="Describe the issue in detail. If the item was not received or arrived damaged, provide specific information..." 
                className="min-h-[150px] rounded-xl border-2"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-900 leading-relaxed font-medium">
                The transaction funds will be placed on hold until a moderator resolves the case. Ensure you provide all necessary proof if contacted.
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setIsDisputeOpen(false)} className="flex-1 rounded-xl h-14 font-black">Cancel</Button>
              <Button 
                onClick={handleOpenDispute} 
                disabled={isProcessingAction || !disputeReason}
                className="flex-1 bg-red-600 text-white font-black rounded-xl h-14 shadow-lg"
              >
                {isProcessingAction ? "Processing..." : "Open Dispute"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl bg-white">
          <div className="bg-orange-600 p-8 text-white">
             <h2 className="text-3xl font-headline font-black uppercase tracking-tight">
               {order.status === 'Return Approved' ? 'Ship Return' : 'Request Return'}
             </h2>
             <p className="text-white/70 text-sm font-medium">
               {order.status === 'Return Approved' ? 'Provide tracking info for the returned item.' : 'Let the seller know why you want to return this item.'}
             </p>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">
                {order.status === 'Return Approved' ? 'Tracking Number' : 'Return Reason'}
              </Label>
              <Textarea 
                placeholder={order.status === 'Return Approved' ? 'Enter your return shipping tracking number...' : 'Tell the seller why you need to return this item. Examples: Item not as described, item damaged, wrong item received, changed mind...'} 
                className="min-h-[120px] rounded-xl border-2"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
              <RotateCcw className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-900 leading-relaxed font-medium">
                {order.status === 'Return Approved' ? 'Once received by the seller, they\'ll verify the item and process your refund.' : 'Once submitted, the seller has 48 hours to approve or deny your return request. Approved returns must be shipped within 14 days.'}
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => { setIsReturnDialogOpen(false); setReturnReason(''); }} className="flex-1 rounded-xl h-14 font-black">Cancel</Button>
              <Button 
                onClick={handleReturnSubmit} 
                disabled={isProcessingReturn || !returnReason.trim()}
                className="flex-1 bg-orange-600 text-white font-black rounded-xl h-14 shadow-lg"
              >
                {isProcessingReturn ? "Processing..." : order.status === 'Return Approved' ? "Confirm Shipped" : "Request Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
