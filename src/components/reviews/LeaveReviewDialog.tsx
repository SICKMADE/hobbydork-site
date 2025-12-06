'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

type LeaveReviewMode = 'SELLER' | 'BUYER';

type LeaveReviewDialogProps = {
  mode: LeaveReviewMode;
  storeId?: string;   // required for SELLER
  buyerUid?: string;  // required for BUYER
  sellerUid: string;
  orderId: string;
  triggerLabel?: string;
  className?: string;
};

export function LeaveReviewDialog({
  mode,
  storeId,
  buyerUid,
  sellerUid,
  orderId,
  triggerLabel,
  className,
}: LeaveReviewDialogProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isSellerReview = mode === 'SELLER';
  const isBuyerReview = mode === 'BUYER';

  const label =
    triggerLabel ??
    (isSellerReview ? 'Review seller' : 'Review buyer');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!firestore || !user) {
      toast({
        title: 'Sign in required',
        description:
          'You must be signed in to leave a review.',
        variant: 'destructive',
      });
      return;
    }

    if (!rating) {
      toast({
        title: 'Pick a rating',
        description: 'Tap how many stars you want to give.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      if (isSellerReview) {
        if (!storeId) {
          throw new Error('Missing storeId for seller review');
        }

        await addDoc(
          collection(
            firestore,
            'storefronts',
            storeId,
            'reviews',
          ),
          {
            orderId,
            reviewerUid: user.uid,
            sellerUid,
            rating,
            comment:
              comment.trim().length > 0
                ? comment.trim()
                : null,
            type: 'SELLER',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
      } else if (isBuyerReview) {
        if (!buyerUid) {
          throw new Error('Missing buyerUid for buyer review');
        }

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
            sellerUid,
            rating,
            comment:
              comment.trim().length > 0
                ? comment.trim()
                : null,
            type: 'BUYER',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );
      }

      toast({
        title: 'Review submitted',
        description: 'Thanks for helping keep the market clean.',
      });

      setSubmitted(true);
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Error submitting review',
        description: err?.message ?? 'Could not submit review.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];

  const effectiveRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={submitted ? 'ghost' : 'outline'}
          size="sm"
          className={className}
          disabled={submitted}
        >
          {submitted
            ? 'Review submitted'
            : label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSellerReview
              ? 'Review this seller'
              : 'Review this buyer'}
          </DialogTitle>
          <DialogDescription>
            Leave an honest, fair review. This helps the community
            avoid scammers and flakes.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {stars.map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onMouseEnter={() =>
                    setHoverRating(star)
                  }
                  onMouseLeave={() =>
                    setHoverRating(0)
                  }
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= effectiveRating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Comment{' '}
              <span className="text-xs text-muted-foreground">
                (optional, max 300 chars)
              </span>
            </Label>
            <Textarea
              rows={4}
              maxLength={300}
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              placeholder={
                isSellerReview
                  ? 'Did the seller ship fast? Was the item as described?'
                  : 'Did the buyer pay quickly? Communicate well?'
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Submitting...'
                : 'Submit review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
