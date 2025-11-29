'use client';
import AppLayout from "@/components/layout/AppLayout";
import PlaceholderContent from "@/components/PlaceholderContent";
import { useAuth } from "@/hooks/use-auth";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import type { Order } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { format } from 'date-fns';
import { useState } from "react";
import ReviewDialog from "@/components/ReviewDialog";
import { placeholderImages } from "@/lib/placeholder-images";

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

export default function OrdersPage() {
    const { profile } = useAuth();
    const firestore = useFirestore();
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore || !profile) return null;
        return query(
            collection(firestore, 'orders'), 
            where('buyerUid', '==', profile.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, profile]);

    const { data: orders, isLoading } = useCollection<Order>(ordersQuery);

    if (isLoading) {
        return <AppLayout><p>Loading your orders...</p></AppLayout>
    }

    if (!isLoading && (!orders || orders.length === 0)) {
        return (
            <AppLayout>
                <PlaceholderContent 
                    title="No Orders Yet"
                    description="You haven't placed any orders. Start shopping to see your orders here."
                />
            </AppLayout>
        );
    }
    
    return (
        <AppLayout>
             <div className="space-y-8">
                <h1 className="text-3xl font-bold">My Orders</h1>
                {orders && orders.map(order => (
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
                                {order.state === 'COMPLETED' && !order.reviewId && (
                                     <Button variant="default" onClick={() => setReviewOrder(order)}>Leave a Review</Button>
                                )}
                                 {order.state === 'COMPLETED' && order.reviewId && (
                                    <p className="text-sm text-green-600 font-semibold">Review Submitted</p>
                                 )}
                             </div>
                             <span className="font-semibold">Total: ${order.totalPrice.toFixed(2)}</span>
                        </CardFooter>
                    </Card>
                ))}
             </div>
             {reviewOrder && (
                <ReviewDialog 
                    order={reviewOrder}
                    open={!!reviewOrder}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setReviewOrder(null);
                        }
                    }}
                />
             )}
        </AppLayout>
    );
}

    
