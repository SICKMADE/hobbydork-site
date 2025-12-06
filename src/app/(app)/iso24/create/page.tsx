'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import AppLayout from '@/components/layout/AppLayout';
import PlaceholderContent from '@/components/PlaceholderContent';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { useFirestore } from '@/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, ArrowLeft } from 'lucide-react';

type ISO24Category =
  | 'COMIC_BOOKS'
  | 'SPORTS_CARDS'
  | 'POKEMON_CARDS'
  | 'VIDEO_GAMES'
  | 'TOYS'
  | 'OTHER';

export default function ISO24CreatePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] =
    useState<ISO24Category | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const canPost =
    !!user &&
    !!firestore &&
    ((profile as any)?.status === 'ACTIVE' ||
      (profile as any)?.role === 'ADMIN');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !canPost) return;

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    if (!trimmedTitle || !trimmedDesc || !category) return;

    setSubmitting(true);
    try {
      // expiresAt = now + 24h
      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      await addDoc(collection(firestore, 'iso24Posts'), {
        title: trimmedTitle,
        description: trimmedDesc,
        category,
        status: 'ACTIVE',
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        expiresAt,
      });

      toast({
        title: 'ISO posted',
        description:
          'Your In Search Of post is now live for 24 hours.',
      });

      router.push('/iso24');
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error posting ISO',
        description:
          err?.message ??
          'Something went wrong creating your ISO.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Sign in to post an ISO"
          description="You need to be logged in to create an In Search Of post."
        >
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/iso24">Back to ISO 24</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  if (!canPost) {
    return (
      <AppLayout>
        <PlaceholderContent
          title="Account limited"
          description="Your account is not currently allowed to post ISO requests."
        >
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/iso24">Back to ISO 24</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="mr-1"
            onClick={() => router.push('/iso24')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight">
              Post an ISO (24 hours)
            </h1>
            <p className="text-[11px] md:text-xs text-muted-foreground">
              Tell people exactly what you’re looking for. Your
              post will automatically expire in 24 hours.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm md:text-base">
              In Search Of post
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Collectors can message you directly if they have
              what you’re looking for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit}
            >
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Title
                </label>
                <Input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="Looking for ASM #300 9.8, Michael Jordan RC, etc."
                  maxLength={120}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Category
                </label>
                <Select
                  value={category}
                  onValueChange={(v) =>
                    setCategory(v as ISO24Category)
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMIC_BOOKS">
                      Comic books
                    </SelectItem>
                    <SelectItem value="SPORTS_CARDS">
                      Sports cards
                    </SelectItem>
                    <SelectItem value="POKEMON_CARDS">
                      Pokémon cards
                    </SelectItem>
                    <SelectItem value="VIDEO_GAMES">
                      Video games
                    </SelectItem>
                    <SelectItem value="TOYS">
                      Toys
                    </SelectItem>
                    <SelectItem value="OTHER">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Details
                </label>
                <Textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  rows={5}
                  className="text-sm resize-none"
                  placeholder="Be specific: grade, print, team, player, year, condition, price range, etc."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/iso24')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    submitting ||
                    !title.trim() ||
                    !description.trim() ||
                    !category
                  }
                >
                  {submitting
                    ? 'Posting…'
                    : 'Post ISO'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
