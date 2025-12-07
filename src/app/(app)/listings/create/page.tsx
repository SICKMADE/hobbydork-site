'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_OPTIONS = [
  { value: 'COMIC_BOOKS', label: 'Comic Books' },
  { value: 'SPORTS_CARDS', label: 'Sports Cards' },
  { value: 'POKEMON_CARDS', label: 'Pokémon Cards' },
  { value: 'VIDEO_GAMES', label: 'Video Games' },
  { value: 'TOYS', label: 'Toys' },
  { value: 'OTHER', label: 'Other' },
];

const CONDITION_OPTIONS = [
  { value: 'MINT', label: 'Mint' },
  { value: 'NEAR_MINT', label: 'Near Mint' },
  { value: 'VERY_FINE', label: 'Very Fine' },
  { value: 'FINE', label: 'Fine' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export default function CreateListingPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('COMIC_BOOKS');
  const [condition, setCondition] = useState<string>('UNKNOWN');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [tags, setTags] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const storeId = profile?.storeId as string | undefined;
  const isSeller = !!profile?.isSeller;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login?redirect=/listings/create');
      return;
    }

    if (profile?.status && profile.status !== 'ACTIVE') {
      router.replace('/');
      return;
    }

    if (!isSeller || !storeId) {
      router.replace('/store/setup?redirect=/listings/create');
      return;
    }
  }, [authLoading, user, profile, isSeller, storeId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !storeId) return;

    const numericPrice = Number(price);
    const numericQty = Number(quantity || '1');

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Enter a title for your listing.',
        variant: 'destructive',
      });
      return;
    }

    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: 'Price required',
        description: 'Enter a valid price greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    if (Number.isNaN(numericQty) || numericQty <= 0) {
      toast({
        title: 'Quantity required',
        description: 'Enter a valid quantity (1 or more).',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'Images required',
        description: 'Add at least one image for this listing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const storage = getStorage();
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const cleanName = file.name.replace(/\s+/g, '_');
        const path = `listingImages/${user.uid}/${Date.now()}_${cleanName}`;
        const storageRef = ref(storage, path);

        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }

      const primaryImageUrl = uploadedUrls[0];
      const imageUrls = uploadedUrls;

      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await addDoc(collection(firestore, 'listings'), {
        storeId,
        ownerUid: user.uid,
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: numericPrice,
        quantityAvailable: numericQty,
        primaryImageUrl,
        imageUrls,
        tags: tagArray,
        state: 'ACTIVE',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Listing created',
        description: 'Your item is now live in your store.',
      });

      router.push('/listings');
    } catch (err: any) {
      console.error('Error creating listing', err);
      toast({
        title: 'Error creating listing',
        description: err?.message ?? 'Something went wrong.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || !profile || !isSeller || !storeId) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create a new listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Amazing key issue, CGC 9.8..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the item: condition, notes, defects, extras..."
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val)}>
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
                  <Select value={condition} onValueChange={(val) => setCondition(val)}>
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
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity available</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="spider-man, key issue, cgc, bronze age"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Add clear photos. The first image will be used as the main cover image.
                </p>

                {files.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 md:grid-cols-4 gap-2">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] border rounded px-1 py-0.5 truncate bg-muted"
                      >
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/listings')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Listing item…' : 'List item'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
