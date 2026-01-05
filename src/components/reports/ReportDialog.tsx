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
import { Select } from '@/components/ui/select'; // if you don't have this, see note below

type ReportTargetType =
  | 'BUYER'
  | 'SELLER'
  | 'LISTING'
  | 'STORE';

type ReportDialogProps = {
  targetUid?: string;          // for BUYER/SELLER
  targetType: ReportTargetType;
  orderId?: string | null;
  listingId?: string | null;
  storeId?: string | null;
  triggerLabel?: string;
  className?: string;
};

export function ReportDialog({
  targetUid,
  targetType,
  orderId = null,
  listingId = null,
  storeId = null,
  triggerLabel,
  className,
}: ReportDialogProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const canReadFirestore =
    !authLoading &&
    !!user &&
    user.emailVerified &&
    profile?.status === "ACTIVE";

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('NON_PAYMENT');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const label =
    triggerLabel ??
    (targetType === 'BUYER'
      ? 'Report buyer'
      : targetType === 'SELLER'
      ? 'Report seller'
      : targetType === 'LISTING'
      ? 'Report listing'
      : 'Report store');

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!canReadFirestore || !firestore) {
      toast({
        title: 'Sign in required',
        description:
          'You must be signed in with an active, verified account to file a report.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(firestore, 'reports'), {
        reporterUid: user.uid,
        targetUid: targetUid ?? null,
        targetType,
        orderId,
        listingId,
        storeId,
        reason,
        details:
          details.trim().length > 0
            ? details.trim()
            : null,
        state: 'OPEN', // server-side / admin can manage state
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Report submitted',
        description:
          'Thanks. An admin will review this.',
      });

      setSubmitted(true);
      setOpen(false);
      setDetails('');
    } catch (err: any) {
      toast({
        title: 'Error submitting report',
        description:
          err?.message ??
          'Could not submit your report.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  // If your design system does NOT have a Select component,
  // replace this <Select> block with a simple <select> element.

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={className}
          disabled={submitted}
        >
          {submitted ? 'Reported' : label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Use this if someone is scamming, harassing, or
            clearly abusing the marketplace. Don’t use this
            for normal disagreements.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              title="Reason for report"
              className="w-full border rounded-md px-2 py-1 text-sm bg-background"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="NON_PAYMENT">
                Non-payment / buyer flaked
              </option>
              <option value="NO_SHIPMENT">
                Seller never shipped
              </option>
              <option value="NOT_AS_DESCRIBED">
                Item not as described
              </option>
              <option value="HARASSMENT">
                Harassment / abusive messages
              </option>
              <option value="SCAM_FRAUD">
                Scam / fraud attempt
              </option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              Details{' '}
              <span className="text-xs text-muted-foreground">
                (optional, max 400 characters)
              </span>
            </Label>
            <Textarea
              id="details"
              rows={4}
              maxLength={400}
              value={details}
              onChange={(e) =>
                setDetails(e.target.value)
              }
              placeholder="Short description of what happened. No private info or links."
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
                : 'Submit report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
