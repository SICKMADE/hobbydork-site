'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { db, storage } from '@/firebase/client-provider';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const CATEGORY_OPTIONS = [
  { value: 'COMIC_BOOKS', label: 'Comic Books' },
  { value: 'SPORTS_CARDS', label: 'Sports Cards' },
  { value: 'POKEMON_CARDS', label: 'Pokémon Cards' },
  { value: 'VIDEO_GAMES', label: 'Video Games' },
  { value: 'TOYS', label: 'Toys' },
  { value: 'OTHER', label: 'Other' },
];

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'VERY_GOOD', label: 'Very Good' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
];

function safeFilename(name) {
  return String(name || 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const listingId = Array.isArray(rawId) ? rawId[0] : rawId;

  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [loadedListing, setLoadedListing] = useState(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('COMIC_BOOKS');
  const [condition, setCondition] = useState('GOOD');
  const [quantityAvailable, setQuantityAvailable] = useState('1');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(true);

  const [newImages, setNewImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const existingImageUrls = useMemo(() => {
    const record = loadedListing || {};
    const primary = record.primaryImageUrl || '';
    const list = Array.isArray(record.imageUrls) ? record.imageUrls : [];
    const urls = [];
    if (primary) urls.push(primary);
    for (const u of list) {
      if (u && u !== primary) urls.push(u);
    }
    return urls;
  }, [loadedListing]);

  useEffect(() => {
    return () => {
      for (const url of previewUrls) URL.revokeObjectURL(url);
    };
  }, [previewUrls]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!listingId) return;

      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'listings', listingId));
        if (!snap.exists()) {
          setLoadedListing(null);
          return;
        }

        const data = { id: snap.id, ...snap.data() };
        if (cancelled) return;

        setLoadedListing(data);
        setTitle(String(data.title || ''));
        setPrice(String(data.price ?? ''));
        setDescription(String(data.description || ''));
        setCategory(String(data.category || 'COMIC_BOOKS'));
        setCondition(String(data.condition || 'GOOD'));
        setQuantityAvailable(String(data.quantityAvailable ?? 1));
        setTags(Array.isArray(data.tags) ? data.tags.join(', ') : '');

        const state = String(data.state || data.status || 'ACTIVE').toUpperCase();
        setPublished(state === 'ACTIVE');
      } catch (e) {
        console.error(e);
        setLoadedListing(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  const isOwner = Boolean(user && loadedListing && user.uid === loadedListing.ownerUid);

  function onPickImages(files) {
    for (const url of previewUrls) URL.revokeObjectURL(url);

    const picked = Array.from(files || []);
    setNewImages(picked);
    setPreviewUrls(picked.map((f) => URL.createObjectURL(f)));
  }

  async function save() {
    if (authLoading) return;

    if (!user) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      router.push(`/login?redirect=/listings/${encodeURIComponent(listingId)}/edit`);
      return;
    }

    if (!loadedListing) return;

    if (!isOwner) {
      toast({
        title: 'Not allowed',
        description: 'You can only edit your own listings.',
        variant: 'destructive',
      });
      return;
    }

    const currentState = String(loadedListing.state || loadedListing.status || '').toUpperCase();
    if (currentState === 'SOLD' || currentState === 'SOLD_OUT') {
      toast({
        title: 'This listing is sold',
        description: "Sold listings can't be edited.",
        variant: 'destructive',
      });
      return;
    }

    if (!title.trim()) {
      toast({ title: 'Missing title', variant: 'destructive' });
      return;
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast({
        title: 'Invalid price',
        description: 'Enter a valid price greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    const numericQty = Number(quantityAvailable);
    if (!Number.isFinite(numericQty) || numericQty <= 0) {
      toast({
        title: 'Invalid quantity',
        description: 'Enter a valid quantity (1 or more).',
        variant: 'destructive',
      });
      return;
    }

    const nextTags = String(tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (newImages.length > 0 && !storage) {
      toast({
        title: 'Uploads unavailable',
        description: 'Storage is not ready yet. Refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const listingRef = doc(db, 'listings', listingId);
      const nextState = published ? 'ACTIVE' : 'DRAFT';

      let uploadedUrls = null;
      if (newImages.length > 0) {
        uploadedUrls = [];
        for (const file of newImages) {
          const path = `listingImages/${user.uid}/${listingId}/${Date.now()}-${safeFilename(file.name)}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          uploadedUrls.push(url);
        }
      }

      await updateDoc(listingRef, {
        title: title.trim(),
        description: String(description || '').trim(),
        category,
        condition,
        tags: nextTags,
        price: numericPrice,
        quantityAvailable: numericQty,
        state: nextState,
        status: nextState,
        ...(uploadedUrls ? { imageUrls: uploadedUrls, primaryImageUrl: uploadedUrls[0] || '' } : {}),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Listing updated' });
      router.push('/seller/listings');
    } catch (e) {
      console.error(e);
      toast({
        title: 'Save failed',
        description: e?.message ?? 'Could not update listing.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading || authLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!loadedListing) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Listing not found"
          description="This listing does not exist or is not available."
        />
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in required"
          description="Please sign in to edit listings."
        >
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href={`/login?redirect=/listings/${encodeURIComponent(listingId)}/edit`}>Sign in</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  if (!isOwner) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Not allowed"
          description="You can only edit your own listings."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Edit listing</h1>
          <Button
            type="button"
            variant="outline"
            className="border-2 border-black bg-muted/40 hover:bg-muted/60"
            onClick={() => router.push('/seller/listings')}
            disabled={saving}
          >
            Back
          </Button>
        </div>

        <Card className="border-2 border-black bg-card/80">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity available</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={quantityAvailable}
                    onChange={(e) => setQuantityAvailable(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} />
              </div>

              <div className="flex items-center gap-3">
                <Checkbox checked={published} onCheckedChange={(v) => setPublished(v === true)} id="published" />
                <Label htmlFor="published">Published</Label>
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <Input type="file" multiple accept="image/*" onChange={(e) => onPickImages(e.target.files)} />
                <p className="text-xs text-muted-foreground">
                  Uploading new images will replace the existing image set.
                </p>

                {previewUrls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {previewUrls.map((u, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={u}
                        alt="Selected"
                        className="h-32 w-full object-contain rounded-md border bg-muted"
                      />
                    ))}
                  </div>
                ) : existingImageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {existingImageUrls.slice(0, 6).map((u, idx) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={u}
                        alt="Existing"
                        className="h-32 w-full object-contain rounded-md border bg-muted"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No images yet.</div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="submit" disabled={saving} className="comic-button">
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
