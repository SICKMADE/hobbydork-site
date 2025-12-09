'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { useFirestore } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type ReportSource =
  | 'CHAT'
  | 'LISTING'
  | 'STORE'
  | 'PROFILE'
  | 'OTHER';

export type ReportUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  targetUid: string;
  targetDisplayName?: string;

  // Optional extra context we can pass in from chat/listings/etc.
  context?: {
    source?: ReportSource;
    listingId?: string | null;
    storeId?: string | null;
  };
};

const REASONS = [
  'Scam / fraud',
  'Harassment / abuse',
  'Hate speech',
  'NSFW / adult content',
  'Spam',
  'Other',
] as const;

type Reason = (typeof REASONS)[number];

export function ReportUserDialog({
  open,
  onOpenChange,
  targetUid,
  targetDisplayName,
  context,
}: ReportUserDialogProps) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [reason, setReason] = useState<Reason>('Scam / fraud');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Not signed in',
        description:
          'You must be signed in to submit a report.',
      });
      return;
    }

    if (!targetUid) {
      toast({
        variant: 'destructive',
        title: 'Missing target',
        description:
          'Could not determine who you are reporting.',
      });
      return;
    }

    const trimmedDetails = details.trim();

    if (!trimmedDetails) {
      toast({
        variant: 'destructive',
        title: 'Add more detail',
        description:
          'Please explain what happened so we can review it.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const reportsCol = collection(firestore, 'reports');

      await addDoc(reportsCol, {
        reporterUid: user.uid,
        targetUid,
        targetDisplayName: targetDisplayName ?? null,

        // Context for moderation tools
        source: context?.source ?? 'OTHER',
        listingId: context?.listingId ?? null,
        storeId: context?.storeId ?? null,

        reason,
        details: trimmedDetails,

        status: 'OPEN',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Report submitted',
        description:
          'Thanks. Our team will review this user and take action if needed.',
      });

      setDetails('');
      setReason('Scam / fraud');
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error submitting report',
        description:
          err?.message ?? 'Could not submit your report.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const displayName =
    targetDisplayName || 'this user';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report user</DialogTitle>
          <DialogDescription>
            You are reporting <strong>{displayName}</strong>.
            Use this only for serious issues like scams,
            harassment, or unsafe content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">
              Reason
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={(v) =>
                setReason(v as Reason)
              }
              className="space-y-2"
            >
              {REASONS.map((r) => (
                <div
                  key={r}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem value={r} id={r} />
                  <Label
                    htmlFor={r}
                    className="text-xs md:text-sm font-normal"
                  >
                    {r}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">
              What happened?
            </Label>
            <Textarea
              rows={4}
              value={details}
              onChange={(e) =>
                setDetails(e.target.value)
              }
              placeholder="Include links, usernames, and any other details that help explain the problem."
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Sending…' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
