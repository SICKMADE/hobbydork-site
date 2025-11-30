'use client';
import AppLayout from "@/components/layout/AppLayout";
import PlaceholderContent from "@/components/PlaceholderContent";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import type { Order, OrderState } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from 'date-fns';
import { placeholderImages } from "@/lib/placeholder-images";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import Link from "next/link";

const getOrderStatusVariant = (status: Order['state']) => {
    switch (status) {
        case 'PENDING_PAYMENT': return 'bg-yellow-500';
        case 'PAYMENT_SENT': return 'bg-blue-500';
        case 'SHIPPED': return 'bg-indigo-500';
        case 'DELIVERED': return 'bg-green-500';
        case 'COMPLETED': return 'bg-green-700';
        case 'CANCELLED': return 'bg-gray-500';
        default: return 'bg-gray-400';
    }
}

export default function SalesPage() {
    const { profile, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const salesQuery = useMemoFirebase(() => {
        if (authLoading || !firestore || !profile || !profile.isSeller) return null;
        return query(
            collection(firestore, 'orders'), 
            where('sellerUid', '==', profile.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, authLoading, profile]);

    const { data: sales, isLoading: salesLoading } = useCollection<Order>(salesQuery);
    
    const handleStateChange = (orderId: string, newState: OrderState) => {
        if (!firestore) return;

        const orderRef = doc(firestore, 'orders', orderId);
        const updateData: {state: OrderState, trackingNumber?: string, trackingCarrier?: string} = { state: newState };
        
        if (newState === 'SHIPPED') {
            updateData.trackingNumber = prompt("Enter tracking number:");
            if (!updateData.trackingNumber) {
                toast({ variant: 'destructive', title: 'Action Canceled', description: 'Tracking number is required to mark as shipped.' });
                return;
            }
            updateData.trackingCarrier = 'UPS'; 
        }

        updateDoc(orderRef, updateData)
            .then(() => {
                toast({ title: 'Order Updated', description: `Order has been moved to ${newState}.` });
            })
            .catch(err => {
                const contextualError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'update',
                    requestResourceData: updateData,
                });
                errorEmitter.emit('permission-error', contextualError);
            });
    };

    if (authLoading) {
        return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;
    }

     if (!profile?.isSeller) {
        return (
            <AppLayout>
                <PlaceholderContent 
                    title="You are not a seller"
                    description="You need to create a store before you can view sales."
                >
                    <Button asChild className="mt-4">
                        <Link href="/store/create">Create a Store</Link>
                    </Button>
                </PlaceholderContent>
            </AppLayout>
        );
    }

    if (salesLoading) {
        return <AppLayout><p>Loading your sales...</p></AppLayout>
    }

    if (!salesLoading && (!sales || sales.length === 0)) {
        return (
            <AppLayout>
                <PlaceholderContent 
                    title="No Sales Yet"
                    description="When a buyer purchases one of your items, the order will appear here."
                />
            </AppLayout>
        );
    }
    
    return (
        <AppLayout>
             <div className="space-y-8">
                <h1 className="text-3xl font-bold">My Sales</h1>
                {sales && sales.map(order => (
                    <Card key={order.id}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div>
                                <CardTitle>Order #{order.orderId.substring(0, 7)}</CardTitle>
                                <CardDescription>
                                    Placed on {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : '...'}
                                </CardDescription>
                            </div>
                            <Badge className={`${getOrderStatusVariant(order.state)} text-white`}>{order.state.replace('_', ' ')}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map(item => (
                                     <div key={item.listingId} className="flex items-center gap-4">
                                        <Image 
                                            src={placeholderImages['listing-image-1']?.imageUrl} 
                                            alt={item.title}
                                            width={60}
                                            height={60}
                                            className="rounded-md object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold">${(item.pricePerUnit * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center bg-muted/50 p-4">
                             <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline">Update Status <MoreHorizontal className="ml-2 h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {order.state === 'PAYMENT_SENT' && <DropdownMenuItem onSelect={() => handleStateChange(order.id, 'SHIPPED')}>Mark as Shipped</DropdownMenuItem>}
                                        {order.state === 'SHIPPED' && <DropdownMenuItem onSelect={() => handleStateChange(order.id, 'DELIVERED')}>Mark as Delivered</DropdownMenuItem>}
                                        {(order.state === 'PENDING_PAYMENT' || order.state === 'PAYMENT_SENT') && <DropdownMenuItem onSelect={() => handleStateChange(order.id, 'CANCELLED')}>Cancel Order</DropdownMenuItem>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                             <span className="font-semibold">Total: ${order.totalPrice.toFixed(2)}</span>
                        </CardFooter>
                    </Card>
                ))}
             </div>
        </AppLayout>
    );
}
