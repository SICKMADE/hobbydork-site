'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();

  // Handle both string and string[]
  const listingId =
    typeof params?.id === 'string'
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : undefined;

  const firestore = useFirestore();
  const router = useRouter();

  const listingRef = useMemoFirebase(() => {
    if (!firestore || !listingId) return null;
    return doc(firestore, 'listings', listingId);
  }, [firestore, listingId]);

  const {
    data: listing,
    isLoading,
    error,
  } = useDoc<any>(listingRef);

  // -------------  States  -------------

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 py-4">
        {/* Back + title bar skeleton */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading listing…</p>
        )}

        {error && (
          <p className="text-sm text-destructive">
            There was a problem loading this listing.
          </p>
        )}

        {!isLoading && !error && !listing && (
          <p className="text-sm text-muted-foreground">
            Listing not found.
          </p>
        )}

        {/* -------------  MAIN CONTENT ------------- */}
        {listing && (
          <div className="grid gap-8 md:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
            {/* LEFT: big image + thumbs + description */}
            <div className="space-y-6">
              {/* MAIN IMAGE */}
              <div className="overflow-hidden rounded-2xl border bg-black/40">
                <div className="relative w-full aspect-[4/3]">
                  {listing.imageUrls && listing.imageUrls.length > 0 ? (
                    <Image
                      src={listing.imageUrls[0]}
                      alt={listing.title}
                      fill
                      className="object-contain"
                    />
                  ) : listing.primaryImageUrl ? (
                    <Image
                      src={listing.primaryImageUrl}
                      alt={listing.title}
                      fill
                      className="object-contain"
                    />
                  ) : null}
                </div>
              </div>

              {/* THUMB STRIP */}
              {listing.imageUrls && listing.imageUrls.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {listing.imageUrls.map((url: string, idx: number) => (
                    <div
                      key={url + idx}
                      className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-muted"
                    >
                      <Image
                        src={url}
                        alt={`${listing.title} thumb ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* DESCRIPTION */}
              <div className="rounded-2xl border bg-card/80 p-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {listing.description || 'No description provided.'}
                </p>
              </div>
            </div>

            {/* RIGHT: title, price, details, actions */}
            <div className="space-y-6">
              {/* TITLE + BASIC INFO */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold leading-tight">
                  {listing.title}
                </h1>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Condition:{' '}
                  <span className="font-semibold text-foreground">
                    {String(listing.condition || '')
                      .replace(/_/g, ' ')
                      .toUpperCase()}
                  </span>{' '}
                  · {listing.quantityAvailable ?? listing.quantityTotal ?? 1}{' '}
                  available
                </p>
                {Array.isArray(listing.tags) && listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {listing.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full border bg-background px-2 py-1"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* PRICE BOX */}
              <div className="rounded-2xl border bg-card/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <p className="mt-1 text-3xl font-bold">
                  $
                  {typeof listing.price === 'number'
                    ? listing.price.toFixed(2)
                    : Number(listing.price || 0).toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buyer and seller will finalize payment (PayPal / Venmo) after
                  you connect.
                </p>

                {/* ACTIONS */}
                <div className="mt-4 flex flex-col gap-3">
                  {/* Message seller – assumes you have /messages page */}
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!listing.ownerUid) return;
                      router.push(
                        `/messages?to=${encodeURIComponent(
                          listing.ownerUid as string,
                        )}`,
                      );
                    }}
                    disabled={!listing.ownerUid}
                  >
                    Message seller
                  </Button>

                  {/* View seller store */}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      if (!listing.storeId) return;
                      router.push(`/store/${listing.storeId}`);
                    }}
                    disabled={!listing.storeId}
                  >
                    View seller&apos;s store
                  </Button>
                </div>
              </div>

              {/* META INFO */}
              <div className="rounded-2xl border bg-card/80 p-4 text-xs text-muted-foreground space-y-2">
                <div>
                  <span className="font-semibold text-foreground">
                    Category:
                  </span>{' '}
                  {String(listing.category || '').replace(/_/g, ' ')}
                </div>
                <div>
                  <span className="font-semibold text-foreground">
                    Listing ID:
                  </span>{' '}
                  {listing.listingId || listingId}
                </div>
                {listing.storeId && (
                  <div>
                    <span className="font-semibold text-foreground">
                      Store ID:
                    </span>{' '}
                    {listing.storeId}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
