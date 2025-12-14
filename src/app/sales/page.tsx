
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';

import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

import {
  ShoppingBag,
  ArrowRight,
  DollarSign,
  Truck,
  CheckCircle2,
  Star,
} from 'lucide-react';

type OrderState =
  | 'REQUESTED'
  | 'INVOICED'
  | 'BUYER_MARKED_PAID'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

type OrderItem = {
  listingId: string;
  title?: string;
  quantity?: number;
  price?: number;
};

type OrderDoc = {
  id?: string;
  buyerUid: string;
  sellerUid: string;
  storeId: string;
  state: OrderState;
  items: OrderItem[];
  createdAt?: any;
  updatedAt?: any;
  invoiceTotal?: number;
  shippingAmount?: number;
  buyerMarkedPaidAt?: any;
  shippedAt?: any;
  completedAt?: any;
  cancelledAt?: any;
  cancelledByUid?: string;
  sellerReviewed?: boolean;
  trackingNumber?: string;
};

type InvoiceFormState = {
  open: boolean;
  orderId: string | null;
  subtotal: number;
  shipping: number;
};

type ShipFormState = {
  open: boolean;
  orderId: string | null;
  trackingNumber: string;
};

type ReviewFormState = {
  open: boolean;
  orderId: string | null;
  buyerUid: string | null;
};

const OPEN_STATES: OrderState[] = [
  'REQUESTED',
  'INVOICED',
  'BUYER_MARKED_PAID',
  'SHIPPED',
];

function statusLabel(state: OrderState): string {
  switch (state) {
    case 'REQUESTED':
      return 'Requested';
    case 'INVOICED':
      return 'Invoiced';
    case 'BUYER_MARKED_PAID':
      return 'Payment sent';
    case 'SHIPPED':
      return 'Shipped';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return state;
  }
}

function statusColor(state: OrderState): string {
  switch (state) {
    case 'REQUESTED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-100';
    case 'INVOICED':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-100';
    case 'BUYER_MARKED_PAID':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-100';
    case 'SHIPPED':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-100';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-100';
    default:
      return '';
  }
}

export default function SalesPage() {
  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab] = useState<'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ALL'>(
    'OPEN',
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormState>({
    open: false,
    orderId: null,
    subtotal: 0,
    shipping: 0,
  });
  const [shipForm, setShipForm] = useState<ShipFormState>({
    open: false,
    orderId: null,
    trackingNumber: '',
  });
  const [reviewForm, setReviewForm] = useState<ReviewFormState>({
    open: false,
    orderId: null,
    buyerUid: null,
  });
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [submittingShip, setSubmittingShip] = useState(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const salesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;

    return query(
      collection(firestore, 'orders'),
      where('sellerUid', '==', user.uid),
    );
  }, [firestore, user?.uid]);

  const { data: orders, isLoading } = useCollection<OrderDoc>(
    salesQuery as any,
  );

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to view your sales"
          description="You need to be logged in to see orders where you are the seller."
        >
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  const normalized = (orders || []).map((docSnap: any) => {
    const o = docSnap as OrderDoc & { id: string };
    const created = o.createdAt?.toDate?.() ?? null;
    const createdText =
      created &&
      formatDistanceToNow(created, { addSuffix: true });

    const firstItem = o.items?.[0];
    const extraCount = Math.max(0, (o.items?.length || 0) - 1);
    const totalQty = (o.items || []).reduce(
      (sum, it) => sum + (it.quantity || 0),
      0,
    );

    return {
      ...o,
      id: o.id,
      created,
      createdText,
      firstItem,
      extraCount,
      totalQty,
    };
  });

  const filtered = normalized.filter((o) => {
    if (tab === 'OPEN') {
      return OPEN_STATES.includes(o.state);
    }
    if (tab === 'COMPLETED') {
      return o.state === 'COMPLETED';
    }
    if (tab === 'CANCELLED') {
      return o.state === 'CANCELLED';
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    const ta =
      a.created?.getTime() ??
      a.createdAt?.toDate?.()?.getTime() ??
      0;
    const tb =
      b.created?.getTime() ??
      b.createdAt?.toDate?.()?.getTime() ??
      0;
    return tb - ta;
  });

  const handleCancel = async (orderId: string) => {
    if (!firestore) return;
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), {
        state: 'CANCELLED',
        cancelledAt: serverTimestamp(),
        cancelledByUid: user!.uid,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: 'Order cancelled',
        description:
          'The buyer will no longer see this as an open order.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error cancelling order',
        description: err?.message ?? 'Could not cancel order.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openInvoiceDialog = (order: OrderDoc & { id: string }) => {
    const subtotal = (order.items || []).reduce(
      (sum, it) =>
        sum + (it.price || 0) * (it.quantity || 0),
      0,
    );
    setInvoiceForm({
      open: true,
      orderId: order.id!,
      subtotal: order.invoiceTotal ?? subtotal,
      shipping: order.shippingAmount ?? 0,
    });
  };

  const closeInvoiceDialog = () => {
    setInvoiceForm({
      open: false,
      orderId: null,
      subtotal: 0,
      shipping: 0,
    });
    setSubmittingInvoice(false);
  };

  const handleSubmitInvoice = async () => {
    if (!firestore || !invoiceForm.orderId) return;

    setSubmittingInvoice(true);
    try {
      const subtotal = Number(invoiceForm.subtotal) || 0;
      const shipping = Number(invoiceForm.shipping) || 0;
      const total = subtotal + shipping;

      await updateDoc(
        doc(firestore, 'orders', invoiceForm.orderId),
        {
          state: 'INVOICED',
          invoiceTotal: subtotal,
          shippingAmount: shipping,
          updatedAt: serverTimestamp(),
        },
      );

      toast({
        title: 'Invoice sent',
        description: `Buyer will see total of $${total.toFixed(
          2,
        )}.`,
      });
      closeInvoiceDialog();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error sending invoice',
        description:
          err?.message ?? 'Could not send invoice.',
        variant: 'destructive',
      });
      setSubmittingInvoice(false);
    }
  };

  const openShipDialog = (order: OrderDoc & { id: string }) => {
    setShipForm({
      open: true,
      orderId: order.id!,
      trackingNumber: order.trackingNumber ?? '',
    });
  };

  const closeShipDialog = () => {
    setShipForm({
      open: false,
      orderId: null,
      trackingNumber: '',
    });
    setSubmittingShip(false);
  };

  const handleSubmitShip = async () => {
    if (!firestore || !shipForm.orderId) return;

    setSubmittingShip(true);
    try {
      await updateDoc(
        doc(firestore, 'orders', shipForm.orderId),
        {
          state: 'SHIPPED',
          trackingNumber: shipForm.trackingNumber.trim(),
          shippedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );
      toast({
        title: 'Order marked shipped',
        description:
          'Buyer will see this as shipped with your tracking number.',
      });
      closeShipDialog();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description:
          err?.message ??
          'Could not mark order as shipped.',
        variant: 'destructive',
      });
      setSubmittingShip(false);
    }
  };

  const openReviewDialog = (order: OrderDoc & { id: string }) => {
    setReviewForm({
      open: true,
      orderId: order.id!,
      buyerUid: order.buyerUid,
    });
    setReviewRating(5);
    setReviewComment('');
  };

  const closeReviewDialog = () => {
    setReviewForm({
      open: false,
      orderId: null,
      buyerUid: null,
    });
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (
      !firestore ||
      !reviewForm.orderId ||
      !reviewForm.buyerUid
    )
      return;
    if (reviewRating < 1 || reviewRating > 5) return;

    setSubmittingReview(true);
    try {
      const orderId = reviewForm.orderId;
      const buyerUid = reviewForm.buyerUid;

      await addDoc(
        collection(
          firestore,
          'users',
          buyerUid,
          'purchaseReviews',
        ),
        {
          orderId,
          buyerUid,
          reviewerUid: user!.uid,
          rating: reviewRating,
          comment: reviewComment.trim(),
          createdAt: serverTimestamp(),
        },
      );

      await updateDoc(doc(firestore, 'orders', orderId), {
        sellerReviewed: true,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Review submitted',
        description:
          'Your review for this buyer has been posted.',
      });
      closeReviewDialog();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error submitting review',
        description:
          err?.message ?? 'Could not submit your review.',
        variant: 'destructive',
      });
      setSubmittingReview(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                My Sales
              </h1>
              <p className="text-xs text-muted-foreground">
                Manage orders where you are the seller: invoice,
                shipping, and reviews.
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={tab}
          onValueChange={(v) =>
            setTab(
              v as 'OPEN' | 'COMPLETED' | 'CANCELLED' | 'ALL',
            )
          }
        >
          <TabsList>
            <TabsTrigger value="OPEN">Open</TabsTrigger>
            <TabsTrigger value="COMPLETED">
              Completed
            </TabsTrigger>
            <TabsTrigger value="CANCELLED">
              Cancelled
            </TabsTrigger>
            <TabsTrigger value="ALL">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading && (
              <div className="mt-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-20 w-full"
                  />
                ))}
              </div>
            )}

            {!isLoading && sorted.length === 0 && (
              <div className="mt-4">
                <PlaceholderContent
                  title="No sales yet"
                  description="When buyers place orders on your listings, they’ll show up here."
                >
                  <div className="mt-4 flex justify-center">
                    <Button asChild>
                      <Link href="/listings/create">
                        Create a listing
                      </Link>
                    </Button>
                  </div>
                </PlaceholderContent>
              </div>
            )}

            {!isLoading && sorted.length > 0 && (
              <div className="mt-4 space-y-2">
                {sorted.map((order) => {
                  const disabled = updatingId === order.id;
                  const firstTitle =
                    order.firstItem?.title ||
                    'Items in this order';
                  const subtotal =
                    order.invoiceTotal ??
                    (order.items || []).reduce(
                      (sum, it) =>
                        sum +
                        (it.price || 0) *
                          (it.quantity || 0),
                      0,
                    );
                  const shipping =
                    order.shippingAmount ?? 0;
                  const total =
                    subtotal + (shipping || 0);

                  const canCancel =
                    order.state === 'REQUESTED' ||
                    order.state === 'INVOICED';
                  const canInvoice =
                    order.state === 'REQUESTED' ||
                    order.state === 'INVOICED';
                  const canShip =
                    order.state === 'BUYER_MARKED_PAID';
                  const canReviewBuyer =
                    order.state === 'COMPLETED' &&
                    !order.sellerReviewed;

                  return (
                    <Card key={order.id}>
                      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                        <div className="space-y-1">
                          <CardTitle className="text-sm">
                            Order #{order.id?.slice(0, 8)}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {order.createdText
                              ? `Placed ${order.createdText}`
                              : order.created &&
                                format(
                                  order.created,
                                  'MMM d, yyyy h:mm a',
                                )}
                          </CardDescription>
                          <div className="flex items-center gap-2 pt-1">
                            <Badge
                              className={`${statusColor(order.state)} text-[11px] px-2 py-0.5`}
                            >
                              {statusLabel(order.state)}
                            </Badge>
                            {order.totalQty > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                {order.totalQty} item
                                {order.totalQty > 1
                                  ? 's'
                                  : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-medium">
                            Total: ${total.toFixed(2)}
                          </p>
                          {shipping > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              Includes ${shipping.toFixed(2)}{' '}
                              shipping
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {firstTitle}
                              {order.extraCount > 0 &&
                                ` + ${order.extraCount} more`}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Buyer:{' '}
                              <Link
                                href={`/messages/new?recipientUid=${order.buyerUid}`}
                                className="underline"
                              >
                                message buyer
                              </Link>
                            </p>
                          </div>

                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                          >
                            <Link
                              href={`/messages/new?recipientUid=${order.buyerUid}`}
                            >
                              <ArrowRight className="mr-1 h-3 w-3" />
                              Message buyer
                            </Link>
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t mt-2 pt-2">
                          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground items-center">
                            {order.state ===
                              'REQUESTED' && (
                              <>
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  Buyer requested to buy. Send
                                  them an invoice with total +
                                  shipping.
                                </span>
                              </>
                            )}
                            {order.state ===
                              'INVOICED' && (
                              <>
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  Waiting for buyer to send
                                  payment and mark it sent.
                                </span>
                              </>
                            )}
                            {order.state ===
                              'BUYER_MARKED_PAID' && (
                              <>
                                <DollarSign className="h-3 w-3" />
                                <span>
                                  Buyer marked payment sent.
                                  Ship the order and add a
                                  tracking number.
                                </span>
                              </>
                            )}
                            {order.state ===
                              'SHIPPED' && (
                              <>
                                <Truck className="h-3 w-3" />
                                <span>
                                  Order shipped. Buyer can mark
                                  it received and complete.
                                </span>
                              </>
                            )}
                            {order.state ===
                              'COMPLETED' && (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  Order completed. Good sale!
                                </span>
                              </>
                            )}
                            {order.state ===
                              'CANCELLED' && (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  Order was cancelled.
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 justify-end">
                            {canInvoice && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={disabled}
                                onClick={() =>
                                  openInvoiceDialog(
                                    order as any,
                                  )
                                }
                              >
                                Send invoice
                              </Button>
                            )}

                            {canShip && (
                              <Button
                                size="sm"
                                disabled={disabled}
                                onClick={() =>
                                  openShipDialog(
                                    order as any,
                                  )
                                }
                              >
                                Mark shipped
                              </Button>
                            )}

                            {canCancel && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={disabled}
                                onClick={() =>
                                  handleCancel(order.id!)
                                }
                              >
                                Cancel order
                              </Button>
                            )}

                            {canReviewBuyer && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() =>
                                  openReviewDialog(
                                    order as any,
                                  )
                                }
                              >
                                <Star className="h-3 w-3" />
                                Review buyer
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Invoice dialog */}
        <Dialog
          open={invoiceForm.open}
          onOpenChange={(open) =>
            open ? null : closeInvoiceDialog()
          }
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">
                Send invoice
              </DialogTitle>
              <DialogDescription className="text-xs">
                Set the item subtotal and shipping so the buyer
                knows what to pay.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">
                  Item subtotal
                </p>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="text-xs"
                  value={invoiceForm.subtotal}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      subtotal: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">
                  Shipping
                </p>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="text-xs"
                  value={invoiceForm.shipping}
                  onChange={(e) =>
                    setInvoiceForm((prev) => ({
                      ...prev,
                      shipping: Number(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                Total the buyer sees:{' '}
                <span className="font-medium">
                  $
                  {(
                    (Number(invoiceForm.subtotal) || 0) +
                    (Number(invoiceForm.shipping) || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeInvoiceDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submittingInvoice}
                onClick={handleSubmitInvoice}
              >
                {submittingInvoice
                  ? 'Sending…'
                  : 'Send invoice'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ship dialog */}
        <Dialog
          open={shipForm.open}
          onOpenChange={(open) =>
            open ? null : closeShipDialog()
          }
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">
                Mark as shipped
              </DialogTitle>
              <DialogDescription className="text-xs">
                Add a tracking number so the buyer can follow
                their package.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">
                  Tracking number
                </p>
                <Input
                  className="text-xs"
                  value={shipForm.trackingNumber}
                  onChange={(e) =>
                    setShipForm((prev) => ({
                      ...prev,
                      trackingNumber: e.target.value,
                    }))
                  }
                  placeholder="1Z..., USPS..., etc."
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeShipDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={submittingShip}
                onClick={handleSubmitShip}
              >
                {submittingShip
                  ? 'Saving…'
                  : 'Mark shipped'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Review buyer dialog */}
        <Dialog
          open={reviewForm.open}
          onOpenChange={(open) =>
            open ? null : closeReviewDialog()
          }
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">
                Review buyer
              </DialogTitle>
              <DialogDescription className="text-xs">
                Rate this buyer’s behavior (paid on time,
                communication, etc). Shows on their profile.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <p className="text-xs font-medium">Rating</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                        reviewRating >= value
                          ? 'bg-yellow-400 text-black border-yellow-500'
                          : 'bg-background text-muted-foreground'
                      }`}
                      onClick={() =>
                        setReviewRating(value)
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium">
                  Comment (optional)
                </p>
                <Textarea
                  rows={3}
                  className="text-xs resize-none"
                  placeholder="Paid quickly, easy to work with, or any issues."
                  value={reviewComment}
                  onChange={(e) =>
                    setReviewComment(e.target.value)
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeReviewDialog}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  submittingReview ||
                  reviewRating < 1 ||
                  reviewRating > 5
                }
                onClick={handleSubmitReview}
              >
                {submittingReview
                  ? 'Submitting…'
                  : 'Submit review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
