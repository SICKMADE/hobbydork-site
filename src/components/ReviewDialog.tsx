'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Order, Store, Review } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Star } from 'lucide-react';

const reviewSchema = z.object({
    rating: z.number().min(1, 'Rating is required.').max(5),
    comment: z.string().min(10, 'Comment must be at least 10 characters.').max(500),
});

interface ReviewDialogProps {
    order: Order;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ReviewDialog({ order, open, onOpenChange }: ReviewDialogProps) {
    const { profile, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const canReadFirestore =
        !authLoading &&
        !!profile &&
        profile.emailVerified &&
        profile.status === "ACTIVE";
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof reviewSchema>>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            comment: '',
        },
    });

    const currentRating = form.watch('rating');

    async function onSubmit(values: z.infer<typeof reviewSchema>) {
        if (!canReadFirestore || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in with an active, verified account to leave a review.' });
            return;
        }
        setIsSubmitting(true);

        const storeRef = doc(firestore, 'storefronts', order.storeId);
        const reviewRef = doc(firestore, `storefronts/${order.storeId}/reviews`, order.id);
        const orderRef = doc(firestore, 'orders', order.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const storeDoc = await transaction.get(storeRef);
                if (!storeDoc.exists()) {
                    throw new Error('Store not found!');
                }
                
                const storeData = storeDoc.data() as Store;

                // Calculate new average rating
                const newRatingCount = storeData.ratingCount + 1;
                const newRatingAverage = ((storeData.ratingAverage * storeData.ratingCount) + values.rating) / newRatingCount;

                // 1. Create the review
                const newReview: Omit<Review, 'createdAt'> & {createdAt: any} = {
                    reviewId: order.id,
                    orderId: order.id,
                    storeId: order.storeId,
                    sellerUid: order.sellerUid,
                    buyerUid: profile.uid,
                    buyerName: profile.displayName || 'Anonymous',
                    buyerAvatar: profile.avatar || '/hobbydork-head.png',
                    rating: values.rating,
                    comment: values.comment,
                    createdAt: serverTimestamp(),
                };
                transaction.set(reviewRef, newReview);

                // 2. Update the store's rating
                transaction.update(storeRef, {
                    ratingCount: newRatingCount,
                    ratingAverage: newRatingAverage,
                });
                
                // 3. Mark the order as having a review
                transaction.update(orderRef, {
                    reviewId: reviewRef.id,
                });
            });

            toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
            onOpenChange(false);
            form.reset();

        } catch (error: any) {
            console.error('Error submitting review:', error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: error.message || 'Could not submit your review.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave a Review</DialogTitle>
                    <DialogDescription>Share your experience for order #{order.id.substring(0, 7)}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overall Rating</FormLabel>
                                    <FormControl>
                                        <div 
                                            className="flex items-center gap-1"
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-8 w-8 cursor-pointer transition-colors ${
                                                        (hoverRating || currentRating) > i
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                    onMouseEnter={() => setHoverRating(i + 1)}
                                                    onClick={() => form.setValue('rating', i + 1, { shouldValidate: true })}
                                                />
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Comment</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Tell us about your experience..."
                                            rows={5}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
