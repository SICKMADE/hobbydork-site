"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db, storage } from "@/firebase/client-provider";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import AppLayout from "@/components/layout/AppLayout";
import PlaceholderContent from "@/components/PlaceholderContent";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

const CATEGORY_OPTIONS = [
  { value: "COMIC_BOOKS", label: "Comic Books" },
  { value: "SPORTS_CARDS", label: "Sports Cards" },
  { value: "POKEMON_CARDS", label: "Pokémon Cards" },
  { value: "VIDEO_GAMES", label: "Video Games" },
  { value: "TOYS", label: "Toys" },
  { value: "OTHER", label: "Other" },
] as const;

const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "VERY_GOOD", label: "Very Good" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
] as const;

export default function CreateListingPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>(
    "COMIC_BOOKS"
  );
  const [condition, setCondition] = useState<(typeof CONDITION_OPTIONS)[number]["value"]>(
    "GOOD"
  );
  const [quantity, setQuantity] = useState("1");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  // Shipping fields
  const [shippingType, setShippingType] = useState<"FREE" | "PAID" | "">("");
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  // Shipping cost estimate
  const [shippingEstimate, setShippingEstimate] = useState<string | null>(null);

  // Estimate shipping cost when weight changes (simple formula: $4 base + $0.25/oz)
  useEffect(() => {
    if (shippingType === "PAID" && weight) {
      const w = parseFloat(weight);
      if (!isNaN(w) && w > 0) {
        const estimate = 4 + 0.25 * w;
        setShippingEstimate(`$${estimate.toFixed(2)}`);
      } else {
        setShippingEstimate(null);
      }
    } else {
      setShippingEstimate(null);
    }
  }, [shippingType, weight]);

  const storeId = userData?.storeId || "";
  const isSeller = Boolean(userData?.isSeller);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isSeller || !storeId) return;
  }, [authLoading, user, isSeller, storeId]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setImages(Array.from(e.target.files));
  }

  async function handleSubmit() {
    // Validate required fields
    if (!title.trim()) {
      toast({ title: "Title required" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Description required" });
      return;
    }
    if (!price) {
      toast({ title: "Price required" });
      return;
    }
    if (!user) {
      toast({ title: "You must be signed in" });
      return;
    }
    if (images.length === 0) {
      toast({ title: "Upload at least one image" });
      return;
    }
    if (!storeId) {
      toast({ title: "Store not ready", description: "Please finish store setup first." });
      return;
    }
    if (!shippingType) {
      toast({ title: "Select shipping type" });
      return;
    }
    if (shippingType === "PAID") {
      if (!weight || !dimensions.length || !dimensions.width || !dimensions.height) {
        toast({ title: "Enter weight and all dimensions for paid shipping" });
        return;
      }
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      toast({ title: "Price required", description: "Enter a valid price greater than 0.", variant: "destructive" });
      return;
    }
    const numericQty = Number(quantity || "1");
    if (Number.isNaN(numericQty) || numericQty <= 0) {
      toast({ title: "Quantity required", description: "Enter a valid quantity (1 or more).", variant: "destructive" });
      return;
    }
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setUploading(true);
    try {
      // 1️⃣ Create listing
      const state = publishNow ? "ACTIVE" : "DRAFT";
      const listingRef = await addDoc(collection(db, "listings"), {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        tags: tagArray,
        price: numericPrice,
        ownerUid: user.uid,
        storeId,
        state,
        status: publishNow ? "ACTIVE" : "DRAFT",
        quantityAvailable: numericQty,
        imageUrls: [],
        primaryImageUrl: "",
        shippingType,
        weight: shippingType === "PAID" ? weight : null,
        dimensions: shippingType === "PAID" ? dimensions : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const listingId = listingRef.id;
      const urls: string[] = [];
      // 2️⃣ Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const path = `listingImages/${user.uid}/${listingId}/${file.name}`;
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snap) => {
              setUploadProgress((p) => {
                const c = [...p];
                c[i] = (snap.bytesTransferred / snap.totalBytes) * 100;
                return c;
              });
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              urls.push(url);
              resolve();
            }
          );
        });
      }
      // 3️⃣ Update listing with images
      await updateDoc(doc(db, "listings", listingId), {
        imageUrls: urls,
        primaryImageUrl: urls[0],
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Listing created" });
      router.push(`/listings/${listingId}`);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create listing" });
    } finally {
      setUploading(false);
    }
  }

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PlaceholderContent title="Sign in required" description="You must be signed in to create a listing.">
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/login?redirect=/listings/create">Sign in</Link>
            </Button>
          </div>
        </PlaceholderContent>
      </AppLayout>
    );
  }

  if (!isSeller || !storeId) {
    return (
      <AppLayout>
        <PlaceholderContent title="Store required" description="You must set up a store before listing items.">
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/store/create">Set up store</Link>
            </Button>
          </div>
        </PlaceholderContent>
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
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
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
                  <Select value={category} onValueChange={(val) => setCategory(val as (typeof CATEGORY_OPTIONS)[number]["value"])}>
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
                  <Select value={condition} onValueChange={(val) => setCondition(val as (typeof CONDITION_OPTIONS)[number]["value"])}>
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


              {/* Shipping choice */}
              <div className="space-y-2">
                <Label>Shipping</Label>
                <Select value={shippingType} onValueChange={(val) => setShippingType(val as "FREE" | "PAID")}> 
                  <SelectTrigger>
                    <SelectValue placeholder="Select shipping type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free Shipping</SelectItem>
                    <SelectItem value="PAID">Buyer Pays Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* If paid shipping, require weight and dimensions */}
              {shippingType === "PAID" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Package Weight (oz)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dimensions (inches)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="L"
                          type="number"
                          min="1"
                          value={dimensions.length}
                          onChange={(e) => setDimensions((d) => ({ ...d, length: e.target.value }))}
                          className="w-16"
                        />
                        <span>x</span>
                        <Input
                          placeholder="W"
                          type="number"
                          min="1"
                          value={dimensions.width}
                          onChange={(e) => setDimensions((d) => ({ ...d, width: e.target.value }))}
                          className="w-16"
                        />
                        <span>x</span>
                        <Input
                          placeholder="H"
                          type="number"
                          min="1"
                          value={dimensions.height}
                          onChange={(e) => setDimensions((d) => ({ ...d, height: e.target.value }))}
                          className="w-16"
                        />
                      </div>
                    </div>
                  </div>
                  {shippingEstimate && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Estimated shipping cost: <span className="font-semibold">{shippingEstimate}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-3">
                <Checkbox
                  checked={publishNow}
                  onCheckedChange={(v) => setPublishNow(v === true)}
                  id="publish-now"
                />
                <Label htmlFor="publish-now">Publish to my store now</Label>
              </div>

              <div className="space-y-2">
                <Label>Images</Label>
                <Input type="file" multiple accept="image/*" onChange={handleImageSelect} />
                <p className="text-xs text-muted-foreground">
                  Add clear photos. The first image will be used as the main cover image.
                </p>

                {images.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map((file, idx) => (
                      <div
                        key={idx}
                        className="text-[10px] border rounded px-1 py-0.5 truncate bg-muted"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploading && uploadProgress.some((p) => (p ?? 0) > 0) && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Uploading images…</p>
                  <div className="grid grid-cols-1 gap-1">
                    {uploadProgress.map((p, i) => (
                      <div key={i} className="text-[11px] text-muted-foreground">
                        Image {i + 1}: {Math.round(p || 0)}%
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/seller/listings")} disabled={uploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? <Spinner size={20} /> : "List item"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
