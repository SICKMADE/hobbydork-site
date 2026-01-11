'use client';

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import type { Listing } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { placeholderImages } from "@/lib/placeholder-images";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getFunctions, httpsCallable } from "firebase/functions";

const shippingSchema = z.object({
  name: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

export default function CartPage() {
  const { items, removeFromCart, subtotal, storeId, clearCart } = useCart();
  const { profile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showShippingForm, setShowShippingForm] = useState(false);

  const form = useForm<z.infer<typeof shippingSchema>>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: profile?.shippingAddress?.name || profile?.displayName || "",
      address1: profile?.shippingAddress?.address1 || "",
      address2: profile?.shippingAddress?.address2 || "",
      city: profile?.shippingAddress?.city || "",
      state: profile?.shippingAddress?.state || "",
      zip: profile?.shippingAddress?.zip || "",
      country: profile?.shippingAddress?.country || "USA",
    },
  });

  const firstListingRef = useMemoFirebase(() => {
    if (!firestore || items.length === 0) return null;
    return doc(firestore, "listings", items[0].listingId);
  }, [firestore, items]);

  const { data: firstListing } = useDoc<Listing>(firstListingRef);

  const handleProceedToShipping = () => {
    if (!profile || !storeId || !firstListing) {
      toast({ variant: "destructive", title: "Error", description: "Login required." });
      return;
    }
    setShowShippingForm(true);
  };

  const handleCheckout = async (shippingValues: z.infer<typeof shippingSchema>) => {
    if (!profile || !firestore || !firstListing) {
      toast({
        variant: "destructive",
        title: "Checkout unavailable",
        description: "Please sign in and wait for the cart to finish loading.",
      });
      // eslint-disable-next-line no-console
      console.info('[checkout] cart blocked', {
        hasProfile: !!profile,
        hasFirestore: !!firestore,
        hasFirstListing: !!firstListing,
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      // eslint-disable-next-line no-console
      console.info('[checkout] cart creating order');
      const batch = writeBatch(firestore);
      const orderRef = doc(collection(firestore, "orders"));

      const order = {
        orderId: orderRef.id,
        buyerUid: profile.uid,
        sellerUid: firstListing.ownerUid,
        storeId,
        items: items.map(i => ({
          listingId: i.listingId,
          title: i.title,
          quantity: i.quantity,
          pricePerUnit: i.price,
        })),
        totalPrice: subtotal,
        state: "PENDING_PAYMENT",
        buyerShippingAddress: shippingValues,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(orderRef, order);
      await batch.commit();

      // eslint-disable-next-line no-console
      console.info('[checkout] cart order committed', { orderId: orderRef.id });

      // 🔥 STRIPE CHECKOUT (Firebase)
      const app = typeof window !== 'undefined' ? (await import('firebase/app')).getApp() : undefined;
      const fn = httpsCallable(getFunctions(app, 'us-central1'), "createCheckoutSession");

      const res = await fn({
        orderId: orderRef.id,
        listingTitle: firstListing.title,
        amountCents: Math.round(subtotal * 100),
        appBaseUrl: window.location.origin,
      }) as { data: { url?: string } };

      // eslint-disable-next-line no-console
      console.info('[checkout] cart createCheckoutSession response', res?.data);

      clearCart();
      const url = res?.data?.url;
      if (!url) {
        throw new Error("Stripe checkout URL missing");
      }
      window.location.href = url;

    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[checkout] cart failed', err);
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Checkout failed",
      });
      setIsCheckingOut(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Shopping Cart</CardTitle>
          </CardHeader>

          <CardContent>
            {showShippingForm ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address1" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address2" render={({ field }) => (
                    <FormItem><FormLabel>Address 2</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="zip" render={({ field }) => (
                      <FormItem><FormLabel>ZIP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                  )} />

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setShowShippingForm(false)}>Back</Button>
                    <Button type="submit" disabled={isCheckingOut}>
                      {isCheckingOut ? "Redirecting…" : `Pay $${subtotal.toFixed(2)}`}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-4xl mb-2">🛒</div>
                <div className="font-semibold mb-1">Your cart is empty</div>
                <div className="text-muted-foreground mb-4">Add items to your cart to start shopping.</div>
                <Button asChild><Link href="/search">Browse Listings</Link></Button>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.listingId} className="flex gap-4 items-center">
                    <Image
                      src={item.primaryImageUrl || placeholderImages["listing-image-1"]?.imageUrl}
                      alt={item.title}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <Link href={`/listings/${item.listingId}`} className="font-semibold hover:underline">
                        {item.title}
                      </Link>
                      <p className="text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p>${(item.price * item.quantity).toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => removeFromCart(item.listingId)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>

          {items.length > 0 && !showShippingForm && (
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleProceedToShipping}>
                Proceed to Checkout
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
