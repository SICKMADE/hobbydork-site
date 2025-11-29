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
import type { Listing, Order } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeholderImages } from "@/lib/placeholder-images";

export default function CartPage() {
    const { items, removeFromCart, subtotal, storeId, clearCart } = useCart();
    const { profile } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // We need to fetch one listing to get the owner UID for the order.
    const firstListingRef = useMemoFirebase(() => {
        if (!firestore || items.length === 0) return null;
        return doc(firestore, 'listings', items[0].listingId);
    }, [firestore, items]);

    const { data: firstListing } = useDoc<Listing>(firstListingRef);

    const handleCheckout = async () => {
        if (!profile || !storeId || !firestore || !firstListing || !profile.paymentMethod || !profile.paymentIdentifier) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "You must be logged in, have items in your cart, and have payment info configured to checkout.",
            });
            return;
        }

        setIsCheckingOut(true);
        try {
            const batch = writeBatch(firestore);
            const newOrderRef = doc(collection(firestore, "orders"));

            const orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'buyerShippingAddress' | 'reviewId' | 'cancelReason'> & { createdAt: any, updatedAt: any } = {
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
                trackingNumber: null,
                trackingCarrier: null,
                paymentMethod: profile.paymentMethod,
                paymentIdentifier: profile.paymentIdentifier,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            batch.set(newOrderRef, orderData);

            // Decrement stock for each item in the order
            items.forEach(item => {
                const listingRef = doc(firestore, 'listings', item.listingId);
                const newQuantity = item.availableQuantity - item.quantity;
                batch.update(listingRef, { 
                    quantityAvailable: newQuantity,
                    // If stock is depleted, mark as SOLD
                    ...(newQuantity === 0 && { state: 'SOLD' })
                });
            });

            await batch.commit();

            toast({
                title: "Order Placed!",
                description: "Your order is now pending payment.",
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
                        {items.length === 0 ? (
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
                                            <Link href={`/listing/${item.listingId}`} className="font-semibold hover:underline">{item.title}</Link>
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
                    {items.length > 0 && (
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleCheckout} 
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
    
