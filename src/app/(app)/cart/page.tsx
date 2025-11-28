'use client';

import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { Trash } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartPage() {
    const { items, removeFromCart, subtotal, storeId } = useCart();

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
                                            src={item.primaryImageUrl || 'https://picsum.photos/seed/placeholder/100/100'} 
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
                            <Button className="w-full" size="lg">Proceed to Checkout</Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
