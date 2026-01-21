"use client";

import { useState } from "react";
import { Elements, stripePromise } from '@/lib/stripe';
import { CardElement, useStripe, useElements } from '@/lib/stripeElements';
import Image from 'next/image';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createBlindBidAuction } from "@/lib/blindBidderApi";
import { uploadAuctionImage } from "@/lib/uploadAuctionImage";

export default function CreateBlindBidder() {
  // Stripe payment state
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const CATEGORY_OPTIONS = [
    { value: "COMIC_BOOKS", label: "Comic Books" },
    { value: "SPORTS_CARDS", label: "Sports Cards" },
    { value: "POKEMON_CARDS", label: "Pokémon Cards" },
    { value: "VIDEO_GAMES", label: "Video Games" },
    { value: "TOYS", label: "Toys" },
    { value: "OTHER", label: "Other" },
  ];
  const CONDITION_OPTIONS = [
    { value: "NEW", label: "New" },
    { value: "LIKE_NEW", label: "Like New" },
    { value: "VERY_GOOD", label: "Very Good" },
    { value: "GOOD", label: "Good" },
    { value: "FAIR", label: "Fair" },
    { value: "POOR", label: "Poor" },
  ];

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0].value);
  const [condition, setCondition] = useState(CONDITION_OPTIONS[3].value);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [shippingType, setShippingType] = useState("FREE");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));
  }

  type CreateBlindBidAuctionResult = {
    data?: {
      paymentIntentClientSecret?: string;
      // add other properties if needed
    };
    // add other properties if needed
  };

  function StripePaymentForm({ paymentIntentClientSecret, onSuccess }: { paymentIntentClientSecret: string, onSuccess: () => void }) {
    const stripe = useStripe();
    const elements = useElements();
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePayment = async (e: React.FormEvent) => {
      e.preventDefault();
      setPaying(true);
      setError(null);
      if (!stripe || !elements) {
        setError('Stripe not loaded');
        setPaying(false);
        return;
      }
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setPaying(false);
        return;
      }
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(paymentIntentClientSecret, {
        payment_method: {
          card: cardElement,
        },
      });
      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setPaying(false);
        return;
      }
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      } else {
        setError('Payment not successful');
      }
      setPaying(false);
    };

    return (
      <form onSubmit={handlePayment} className="space-y-4">
        <CardElement options={{ hidePostalCode: true }} className="border rounded p-2" />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <Button type="submit" disabled={paying}>
          {paying ? 'Processing...' : 'Pay & Create Auction'}
        </Button>
      </form>
    );
  }

  async function handleCreate() {
    let imageUrl: string | null = null;
    if (!user || !profile) {
      toast({
        title: "Not allowed",
        description: "You must be logged in to create a blind auction.",
        variant: "destructive",
      });
      return;
    }
    if (!profile.isSeller) {
      toast({
        title: "Become a seller",
        description: "You must apply to become a seller to list a blind auction.",
        action: (
          <Button onClick={() => router.push('/become-seller')}>Apply to become a seller</Button>
        ),
      });
      return;
    }
    if (profile.status !== "ACTIVE" || !user.emailVerified) {
      toast({
        title: "Not allowed",
        description: "You must be an active, verified seller to create a blind auction.",
        variant: "destructive",
      });
      return;
    }
    if (!title.trim() || !desc.trim()) {
      toast({ title: "Missing info", description: "Title and description required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Upload first image if present
      if (images.length > 0) {
        const file = images[0];
        const ext = file.name.split('.').pop() || 'jpg';
        const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
        const timestamp = Date.now();
        // Use a pseudo listingId for blindbidder, or update backend to return auctionId first if needed
        const pseudoListingId = `blindbid_${timestamp}`;
        const path = `blindBidderImages/${user.uid}/${pseudoListingId}/${safeTitle}.${ext}`;
        imageUrl = await uploadAuctionImage(file, path);
      }
      // Call backend to create auction and get Stripe payment intent
      const rawResult = await createBlindBidAuction({ title, description: desc, imageUrl });
      const result: CreateBlindBidAuctionResult = {
        data: rawResult.data as { paymentIntentClientSecret?: string }
      };
      const clientSecret = result?.data?.paymentIntentClientSecret;
      if (!clientSecret) throw new Error("Stripe payment intent not returned");
      setPaymentIntentClientSecret(clientSecret);
      toast({ title: "Proceed to payment", description: "Enter your card to pay and create the auction." });
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create listing.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Create Blind Bidder Auction</h1>
          {paymentIntentClientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentIntentClientSecret }}>
              <StripePaymentForm paymentIntentClientSecret={paymentIntentClientSecret} onSuccess={() => {
                toast({ title: 'Auction created!', description: 'Your blind bidder auction is live.' });
                setPaymentIntentClientSecret(null);
                router.push('/blind-bidder');
              }} />
            </Elements>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sellers pay a $4.99 flat fee to list. Auction lasts 24 hours. All bids are hidden until the end.
            </p>
          )}
        </div>
        {!paymentIntentClientSecret && (
        <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={e => { e.preventDefault(); void handleCreate(); }}>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Amazing key issue, CGC 9.8..." value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe the item: condition, notes, defects, extras..." rows={5} value={desc} onChange={e => setDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    title="Category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border rounded px-2 py-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <select
                    id="condition"
                    title="Condition"
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full border rounded px-2 py-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CONDITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity available</Label>
                  <Input id="quantity" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-2 text-muted-foreground text-sm pt-6">
                  All Blind Bidder auctions start at <span className="font-bold">$1</span>.
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" placeholder="spider-man, key issue, cgc, bronze age" value={tags} onChange={e => setTags(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingType">Shipping</Label>
                <select
                  id="shippingType"
                  title="Shipping"
                  value={shippingType}
                  onChange={e => setShippingType(e.target.value as "FREE" | "PAID")}
                  className="w-full border rounded px-2 py-1 bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="FREE">Free Shipping</option>
                  <option value="PAID">Buyer Pays Shipping</option>
                </select>
              </div>
              {shippingType === "PAID" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Package Weight (oz)</Label>
                    <Input id="weight" type="number" min="0.1" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dimensions (inches)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="L" type="number" min="1" value={dimensions.length} onChange={e => setDimensions(d => ({ ...d, length: e.target.value }))} className="w-16" />
                      <span>x</span>
                      <Input placeholder="W" type="number" min="1" value={dimensions.width} onChange={e => setDimensions(d => ({ ...d, width: e.target.value }))} className="w-16" />
                      <span>x</span>
                      <Input placeholder="H" type="number" min="1" value={dimensions.height} onChange={e => setDimensions(d => ({ ...d, height: e.target.value }))} className="w-16" />
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Images</Label>
                <Input type="file" multiple accept="image/*" onChange={handleImageSelect} />
                <p className="text-xs text-muted-foreground">Add clear photos. The first image will be used as the main cover image.</p>
                {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map((file, idx) => (
                      <div key={idx} className="text-[10px] border rounded px-1 py-0.5 truncate bg-muted" title={file.name}>{file.name}</div>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="comic-button" disabled={submitting}>
                {submitting ? "Submitting..." : "Pay $4.99 & Create Auction"}
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </AppLayout>
  );
}
