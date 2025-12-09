'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase';

import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function ApplySellerPage() {
  const { user, profile } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [website, setWebsite] = useState('');
  const [otherLinks, setOtherLinks] = useState('');
  const [agreementsChecked, setAgreementsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sellerStatus = (profile as any)?.sellerStatus as
    | 'NONE'
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | undefined;

  // If already approved, send them to store setup
  if (sellerStatus === 'APPROVED') {
    router.replace('/store/create');
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!firestore || !user) {
      toast({
        variant: 'destructive',
        title: 'Not signed in',
        description: 'You must be signed in to apply.',
      });
      return;
    }

    if (sellerStatus === 'PENDING') {
      toast({
        title: 'Application already pending',
        description: 'We are already reviewing your application.',
      });
      return;
    }

    if (!file) {
      toast({
        variant: 'destructive',
        title: 'Inventory image required',
        description:
          'Please upload a clear photo of your inventory or what you plan to sell.',
      });
      return;
    }

    if (!agreementsChecked) {
      toast({
        variant: 'destructive',
        title: 'Seller agreement required',
        description:
          'You must agree to the HobbyDork seller terms and platform rules to apply.',
      });
      return;
    }

    setSubmitting(true);

    try {
      // 1) Upload proof image to Storage
      const storage = getStorage();
      const imageRef = ref(
        storage,
        `sellerApplications/${user.uid}/proof-${Date.now()}`,
      );
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);

      // 2) Create application doc
      const applicationsCol = collection(firestore, 'sellerApplications');
      const applicationRef = doc(applicationsCol);

      const appData = {
        applicationId: applicationRef.id,
        ownerUid: user.uid,
        ownerEmail: user.email ?? null,
        ownerDisplayName: profile?.displayName ?? null,
        inventoryImageUrl: imageUrl,
        notes: notes.trim() || null,
        social: {
          instagram: instagram.trim() || null,
          facebook: facebook.trim() || null,
          twitter: twitter.trim() || null,
          tiktok: tiktok.trim() || null,
          website: website.trim() || null,
          other: otherLinks.trim() || null,
        },
        sellerAgreementAccepted: true,
        sellerAgreementAcceptedAt: serverTimestamp(),
        status: 'PENDING', // rules enforce this
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(applicationRef, appData);

      // 3) Mark user as PENDING
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        sellerStatus: 'PENDING',
        sellerApplicationId: applicationRef.id,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Application submitted',
        description:
          'Your seller application is now pending review. You will be approved or rejected by an admin.',
      });

      router.push('/');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error submitting application',
        description: err?.message ?? 'Could not submit your application.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If already pending, just show a message instead of the form
  if (sellerStatus === 'PENDING') {
    return (
      <AppLayout>
        <div className="mx-auto max-w-xl px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Seller application pending</CardTitle>
              <CardDescription>
                We are reviewing your application to become a seller. You&apos;ll
                be able to create a store and list items once you&apos;re approved.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Apply to become a seller</CardTitle>
            <CardDescription>
              Send a clear photo of your inventory and tell us where else you sell.
              We manually approve sellers to keep HobbyDork safe and scam-free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Inventory image */}
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide">
                  Inventory photo
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                <p className="text-[11px] text-muted-foreground">
                  Real photo of what you sell (long boxes, slabs, cards, toys, etc.).
                  No stock images.
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wide">
                  About your selling
                </Label>
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what you sell, where you’ve sold before, shipping, etc."
                  disabled={submitting}
                />
              </div>

              {/* Social media / links */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  Social proof (optional but recommended)
                </p>

                <div className="space-y-2">
                  <Label className="text-xs">Instagram</Label>
                  <Input
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle or profile URL"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Facebook</Label>
                  <Input
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="Profile or group URL"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Twitter / X</Label>
                  <Input
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@yourhandle or profile URL"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">TikTok</Label>
                  <Input
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@yourhandle or profile URL"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Website / shop URL</Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Link to eBay, Whatnot, personal shop, etc."
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Other links</Label>
                  <Textarea
                    rows={2}
                    value={otherLinks}
                    onChange={(e) => setOtherLinks(e.target.value)}
                    placeholder="Any other links or info you want us to see."
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Seller agreement */}
              <div className="flex items-start gap-2 rounded-md border p-3">
                <Checkbox
                  checked={agreementsChecked}
                  onCheckedChange={(v) => setAgreementsChecked(Boolean(v))}
                  disabled={submitting}
                />
                <div className="space-y-1 text-xs leading-snug">
                  <p>
                    I confirm that I have read and agree to the HobbyDork seller
                    rules, including:
                  </p>
                  <ul className="list-disc pl-4">
                    <li>Only selling items I actually own.</li>
                    <li>
                      No off-platform or &quot;friends &amp; family&quot; only deals;
                      Goods &amp; Services is required.
                    </li>
                    <li>No fake books, bootlegs, or counterfeit items.</li>
                    <li>
                      Shipping in a reasonable time and communicating with buyers.
                    </li>
                    <li>
                      No harassment, threats, or scummy behavior toward buyers
                      or other sellers.
                    </li>
                  </ul>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
