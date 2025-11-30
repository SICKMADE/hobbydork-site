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
import type { Listing, Order, ShippingAddress } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeholderImages } from "@/lib/placeholder-images";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const shippingSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address1: z.string().min(1, "Address is required"),
    address2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "ZIP code is required"),
    country: z.string().min(1, "Country is required"),
});

export default function CartPage() {
    const { items, removeFromCart, subtotal, storeId, clearCart } = useCart();
    const { profile } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showShippingForm, setShowShippingForm] = useState(false);

    const form = useForm<z.infer<typeof shippingSchema>>({
        resolver: zodResolver(shippingSchema),
        defaultValues: {
            name: profile?.displayName || "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            zip: "",
            country: "USA",
        },
    });

    const firstListingRef = useMemoFirebase(() => {
        if (!firestore || items.length === 0) return null;
        return doc(firestore, 'listings', items[0].listingId);
    }, [firestore, items]);

    const { data: firstListing } = useDoc<Listing>(firstListingRef);

    const handleProceedToShipping = () => {
        if (!profile || !storeId || !firstListing) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in and have items in your cart to checkout.",
            });
            return;
        }
         if (!profile.paymentMethod || !profile.paymentIdentifier) {
            toast({
                variant: "destructive",
                title: "Payment Info Missing",
                description: "Please set up your payment information in Settings before checking out.",
            });
             router.push('/settings');
            return;
        }
        setShowShippingForm(true);
    };

    const handleCheckout = async (shippingValues: z.infer<typeof shippingSchema>) => {
        if (!profile || !storeId || !firestore || !firstListing || !profile.paymentMethod || !profile.paymentIdentifier) {
            // This check is redundant if handleProceedToShipping is used, but good for safety
            return;
        }

        setIsCheckingOut(true);
        try {
            const batch = writeBatch(firestore);
            const newOrderRef = doc(collection(firestore, "orders"));

            const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'reviewId' | 'cancelReason'> & { createdAt: any, updatedAt: any } = {
                orderId: newOrderRef.id,
                buyerUid: profile.uid,
                sellerUid: firstListing.ownerUid,
                storeId: storeId,
                items: items.map(item => ({
                    listingId: item.listingId,
                    title: item.title,
                    quantity: item.quantity,
                    pricePerUnit: item.price,
                })),
                totalPrice: subtotal,
                state: "PENDING_PAYMENT",
                buyerShippingAddress: shippingValues,
                trackingNumber: null,
                trackingCarrier: null,
                paymentMethod: profile.paymentMethod,
                paymentIdentifier: profile.paymentIdentifier,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            batch.set(newOrderRef, orderData);
            
            await batch.commit();

            toast({
                title: "Order Placed!",
                description: "Your order is now pending payment. You will be notified of status updates.",
            });

            clearCart();
            router.push('/orders');

        } catch (error: any) {
            console.error("Checkout failed:", error);
            toast({
                variant: "destructive",
                title: "Checkout Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
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
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Shipping Address</h3>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="address1" render={({ field }) => (<FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="address2" render={({ field }) => (<FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State / Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name="zip" render={({ field }) => (<FormItem><FormLabel>ZIP / Postal Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                        <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        
                                        <div className="flex justify-between pt-4">
                                            <Button variant="outline" onClick={() => setShowShippingForm(false)}>Back to Cart</Button>
                                            <Button type="submit" disabled={isCheckingOut}>{isCheckingOut ? 'Placing Order...' : `Place Order ($${subtotal.toFixed(2)})`}</Button>
                                        </div>
                                    </form>
                                </Form>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">Your cart is empty.</p>
                                <Button asChild>
                                    <Link href="/search">Continue Shopping</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {items.map(item => (
                                    <div key={item.listingId} className="flex items-center gap-4">
                                        <Image 
                                            src={item.primaryImageUrl || placeholderImages['listing-image-1']?.imageUrl} 
                                            alt={item.title}
                                            width={80}
                                            height={80}
                                            className="rounded-md object-cover"
                                        />
                                        <div className="flex-1">
                                            <Link href={`/listings/${item.listingId}`} className="font-semibold hover:underline">{item.title}</Link>
                                            <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.listingId)}>
                                                <Trash className="h-4 w-4 text-muted-foreground"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Separator />
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <span>Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    {items.length > 0 && !showShippingForm && (
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleProceedToShipping} 
                                disabled={isCheckingOut || !firstListing}
                            >
                                {isCheckingOut ? 'Processing...' : 'Proceed to Checkout'}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
    

    