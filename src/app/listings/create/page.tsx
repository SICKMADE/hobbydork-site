"use client";
  // Shipping address fields and validation
  const [address, setAddress] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US"
  });
  const [addressError, setAddressError] = useState<string | null>(null);

  function validateAddress(addr: typeof address): string | null {
    if (!addr.name.trim()) return "Recipient name required";
    if (!addr.street.trim()) return "Street address required";
    if (!addr.city.trim()) return "City required";
    if (!addr.state.trim()) return "State required";
    if (!addr.zip.trim() || !/^\d{5}(-\d{4})?$/.test(addr.zip)) return "Valid ZIP code required";
    if (addr.country !== "US") return "Only US shipping is supported";
    return null;
  }
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect } from "react";
import Papa from "papaparse";
// Simple error boundary for the page
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // Log error to service if needed
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-700">An unexpected error occurred: {this.state.error?.message || String(this.state.error)}</div>;
    }
    return this.props.children;
  }
}
import { addDoc, collection, updateDoc, doc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "@/firebase/client-provider";import AppLayout from "@/components/layouts/AppLayout";
import { Dialog } from "@/components/ui/dialog";
import DialogContent from "@/components/ui/DialogContent";
import DialogHeader from "@/components/ui/DialogHeader";
import DialogTitle from "@/components/ui/DialogTitle";
import DialogFooter from "@/components/ui/DialogFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CardHeader from "@/components/ui/CardHeader";
// ...existing code...
// ...existing code...
import CardContent from "@/components/ui/card-content";
import { Skeleton } from "@/components/ui/skeleton";
import PlaceholderContent from "@/components/ui/PlaceholderContent";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import TooltipTrigger from "@/components/ui/TooltipTrigger";
import TooltipContent from "@/components/ui/TooltipContent";
import Spinner from "@/components/ui/spinner";
import { MdInfoOutline as Info } from "react-icons/md";
import CardTitle from "@/components/ui/CardTitle"; // Changed to default import
// Add any other missing imports as needed

const CATEGORY_OPTIONS = [
  { value: "COMIC_BOOKS", label: "Comic Books" },
  { value: "TRADING_CARDS", label: "Trading Cards" },
  { value: "TOYS", label: "Toys" },
  { value: "VIDEO_GAMES", label: "Video Games" },
  { value: "OTHER", label: "Other" },
] as const;

const CONDITION_OPTIONS = [
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
] as const;

export default function CreateListingPage() {
  // Save as Draft handler (moved from top-level code)
  const handleSaveDraft = async () => {
    if (!db) {
      toast({ title: "Database not available", description: "Please try again later." });
      return;
    }
    setUploading(true);
    try {
      let docRef, docId, tier = sellerTier;
      const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (saleType === 'AUCTION') {
        const base = parseFloat(startingPrice) || 0;
        const auctionData: any = {
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          tags: tagArray,
          startingPrice: base,
          sellerUid: user?.uid ?? "",
          storeId,
          state: "DRAFT",
          status: "DRAFT",
          imageUrls: [],
          primaryImageUrl: "",
          shippingType,
          weight: shippingType === "PAID" ? weight : null,
          dimensions: shippingType === "PAID" ? dimensions : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          endsAt: auctionEndsAt ? new Date(auctionEndsAt) : null,
          sellerTier: tier,
        };
        if (reservePrice && !isNaN(Number(reservePrice)) && Number(reservePrice) > 0) {
          auctionData.reservePrice = Number(reservePrice);
        }
        if (minBidIncrement && !isNaN(Number(minBidIncrement)) && Number(minBidIncrement) >= 0.01) {
          auctionData.minBidIncrement = Number(minBidIncrement);
        } else {
          auctionData.minBidIncrement = 1.0;
        }
        docRef = await addDoc(collection(db, "auctions"), auctionData);
        docId = docRef.id;
      } else {
        const numericPrice = Number(price) || 0;
        const numericQty = Number(quantity || "1") || 1;
        docRef = await addDoc(collection(db, "listings"), {
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          tags: tagArray,
          price: numericPrice,
          ownerUid: user?.uid ?? "",
          storeId,
          state: "DRAFT",
          status: "DRAFT",
          quantityAvailable: numericQty,
          imageUrls: [],
          primaryImageUrl: "",
          shippingType,
          weight: shippingType === "PAID" ? weight : null,
          dimensions: shippingType === "PAID" ? dimensions : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          sellerTier: tier,
        });
        docId = docRef.id;
      }
      toast({ title: "Draft saved!", description: "You can finish and publish this later from your dashboard." });
      router.push("/seller/listings");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to save draft", description: e?.message || String(e) });
    } finally {
      setUploading(false);
    }
  };
  // Refs for accessibility focus
  const titleRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
  const priceRef = React.useRef<HTMLInputElement>(null);
  const startingPriceRef = React.useRef<HTMLInputElement>(null);
  const reservePriceRef = React.useRef<HTMLInputElement>(null);
  const minBidIncrementRef = React.useRef<HTMLInputElement>(null);
  const auctionEndsAtRef = React.useRef<HTMLInputElement>(null);
  // Move image up in the array
  const moveImageUp = (idx: number) => {
    if (idx === 0) return;
    setImages((imgs) => {
      const arr = [...imgs];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  };
  // Move image down in the array
  const moveImageDown = (idx: number) => {
    setImages((imgs) => {
      if (idx === imgs.length - 1) return imgs;
      const arr = [...imgs];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  };
  const [reservePrice, setReservePrice] = useState("");
  const [minBidIncrement, setMinBidIncrement] = useState("");
  const [feeConfirmed, setFeeConfirmed] = useState(false);
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Success modal state
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdType, setCreatedType] = useState<"AUCTION" | "LISTING" | null>(null);
  const [createdDocId, setCreatedDocId] = useState<string | null>(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Bulk listing modal state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkCsvError, setBulkCsvError] = useState<string | null>(null);
  const [bulkItems, setBulkItems] = useState<any[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Success modal close handler
  const handleSuccessClose = () => {
    setSuccessModalOpen(false);
    if (createdDocId && createdType) {
      if (createdType === 'AUCTION') {
        router.push(`/auctions/${createdDocId}`);
      } else {
        router.push(`/listings/${createdDocId}`);
      }
    }
  };

  // Auto-save form progress
  const FORM_KEY = "listingFormDraft";
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [auctionEndsAt, setAuctionEndsAt] = useState("");
  // Sale type: 'BUY_NOW' or 'AUCTION'
  const [saleType, setSaleType] = useState<'BUY_NOW' | 'AUCTION'>('BUY_NOW');
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]["value"]>("COMIC_BOOKS");
  const [condition, setCondition] = useState<(typeof CONDITION_OPTIONS)[number]["value"]>("FAIR");
  const [quantity, setQuantity] = useState("1");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Restore form from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(FORM_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTitle(data.title || "");
        setPrice(data.price || "");
        setStartingPrice(data.startingPrice || "");
        setAuctionEndsAt(data.auctionEndsAt || "");
        setSaleType(data.saleType || 'BUY_NOW');
        setDescription(data.description || "");
        setCategory(data.category || "COMIC_BOOKS");
        setCondition(data.condition || "FAIR");
        setQuantity(data.quantity || "1");
        setTags(data.tags || "");
        // Images cannot be restored for security reasons
      } catch {}
    }
  }, []);

  // Save form to localStorage on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    const data = {
      title,
      price,
      startingPrice,
      auctionEndsAt,
      saleType,
      description,
      category,
      condition,
      quantity,
      tags,
    };
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
  }, [title, price, startingPrice, auctionEndsAt, saleType, description, category, condition, quantity, tags]);

  // Clear draft on successful submit
  const clearFormDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(FORM_KEY);
    }
  };
  const MAX_IMAGE_SIZE_MB = 5;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [publishNow, setPublishNow] = useState(true);
  // Shipping fields
  const [shippingType, setShippingType] = useState<"FREE" | "PAID" | "">("");
  const [carrier, setCarrier] = useState<string>("");
  const CARRIER_OPTIONS = [
    { value: "USPS", label: "USPS" },
    { value: "UPS", label: "UPS" },
    { value: "FedEx", label: "FedEx" },
    { value: "DHL", label: "DHL" },
  ];
  const [weight, setWeight] = useState("");
  const [dimensions, setDimensions] = useState({ length: "", width: "", height: "" });
  // Address type
  type Address = {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  // Prefill seller address from userData/store
  const storeAddress = userData?.storeAddress as Partial<Address> | undefined;
  const defaultAddress: Address = {
    name: typeof userData?.storeName === "string" ? userData.storeName : (typeof userData?.displayName === "string" ? userData.displayName : ""),
    street: typeof storeAddress?.street === "string" ? storeAddress.street : "",
    city: typeof storeAddress?.city === "string" ? storeAddress.city : "",
    state: typeof storeAddress?.state === "string" ? storeAddress.state : "",
    zip: typeof storeAddress?.zip === "string" ? storeAddress.zip : "",
    country: typeof storeAddress?.country === "string" ? storeAddress.country : "US",
  };
  const [address, setAddress] = useState<Address>(defaultAddress);
  // When userData changes, update address if not already filled
  useEffect(() => {
    setAddress((prev: Address) => {
      // Only prefill if all fields are empty
      const isEmpty = !prev.name && !prev.street && !prev.city && !prev.state && !prev.zip && !prev.country;
      if (isEmpty) {
        return defaultAddress;
      }
      return prev;
    });
  }, [userData]);
  // Shipping cost estimate (mock API)
  const [shippingEstimate, setShippingEstimate] = useState<string | null>(null);
  const [shippingEstimateLoading, setShippingEstimateLoading] = useState(false);

  // Mock shipping rate API function
  async function fetchMockShippingRate(carrier: string, weight: string, dimensions: { length: string, width: string, height: string }) {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 500));
    // Simple mock logic: base + carrier + dimensions
    const w = parseFloat(weight);
    const l = parseFloat(dimensions.length);
    const wid = parseFloat(dimensions.width);
    const h = parseFloat(dimensions.height);
    if (isNaN(w) || w <= 0 || isNaN(l) || isNaN(wid) || isNaN(h) || l <= 0 || wid <= 0 || h <= 0) return null;
    let base = 4;
    if (carrier === "UPS") base += 2;
    if (carrier === "FedEx") base += 3;
    if (carrier === "DHL") base += 4;
    // Add weight and volume factors
    base += w * 0.25;
    base += (l * wid * h) / 500;
    return `$${base.toFixed(2)}`;
  }

  // Estimate shipping cost when carrier, weight, or dimensions change
  useEffect(() => {
    async function updateEstimate() {
      if (shippingType === "PAID" && carrier && weight && dimensions.length && dimensions.width && dimensions.height) {
        setShippingEstimateLoading(true);
        const estimate = await fetchMockShippingRate(carrier, weight, dimensions);
        setShippingEstimate(estimate);
        setShippingEstimateLoading(false);
      } else {
        setShippingEstimate(null);
      }
    }
    updateEstimate();
  }, [shippingType, carrier, weight, dimensions.length, dimensions.width, dimensions.height]);

  const storeId = userData?.storeId || "";
  const isSeller = Boolean(userData?.isSeller);
  const sellerTier = userData?.tier || "BRONZE";

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    if (!isSeller || !storeId) return;
  }, [authLoading, user, isSeller, storeId]);

  // --- Tier-based fee logic ---
  function getSellerTier() {
    // Default to Bronze if not set
    return userData?.tier || "BRONZE";
  }

  function getListingFee(price: number) {
    const tier = getSellerTier();
    if (tier === "GOLD") return price * 0.05;
    if (tier === "SILVER") return price * 0.07;
    return price * 0.10; // Bronze
  }

  function getNetProceeds(price: number) {
    return price - getListingFee(price);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: `Only JPG, PNG, WEBP allowed.` });
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Max size is ${MAX_IMAGE_SIZE_MB}MB.` });
        return false;
      }
      return true;
    });
    setImages(validFiles);
    setImagePreviews(validFiles.map(file => URL.createObjectURL(file)));
  }

  // Drag-and-drop handler
  function handleImageDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Invalid file type", description: `Only JPG, PNG, WEBP allowed.` });
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({ title: "File too large", description: `Max size is ${MAX_IMAGE_SIZE_MB}MB.` });
        return false;
      }
      return true;
    });
    setImages(validFiles);
    setImagePreviews(validFiles.map(file => URL.createObjectURL(file)));
  }

  // Preview handler: open preview modal instead of submitting directly
  function handlePreview() {
    // Validate required fields (reuse validation logic from handleSubmit)
    function validateTitle(val: string): string | null {
      const titleRegex = /^[\w\d\s.,'"!?-]{4,80}$/;
      if (!val.trim()) return "Title required";
      if (val.trim().length < 4 || val.trim().length > 80) return "Title must be 4-80 characters";
      if (!titleRegex.test(val.trim())) return "Title contains invalid characters";
      return null;
    }
    function validateDescription(val: string): string | null {
      if (!val.trim()) return "Description required";
      if (val.trim().length < 10) return "Description must be at least 10 characters";
      if (val.trim().length > 2000) return "Description too long (max 2000 chars)";
      return null;
    }
    function validatePrice(val: string): string | null {
      const priceRegex = /^(?:[1-9]\d{0,4}|0)(?:\.\d{1,2})?$/;
      if (!val.trim()) return "Price required";
      if (!priceRegex.test(val.trim())) return "Price must be a valid number (max 99999.99)";
      if (parseFloat(val) <= 0) return "Price must be greater than 0";
      return null;
    }
    function validateQuantity(val: string): string | null {
      if (!val.trim()) return "Quantity required";
      const qtyNum = Number(val.trim());
      if (!Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > 999) return "Quantity must be an integer between 1 and 999";
      return null;
    }
    const titleError = validateTitle(title);
    if (titleError) { toast({ title: titleError }); return; }
    const descError = validateDescription(description);
    if (descError) { toast({ title: descError }); return; }
    if (saleType === 'BUY_NOW') {
      const priceError = validatePrice(price);
      if (priceError) { toast({ title: priceError }); return; }
    }
    const qtyError = validateQuantity(quantity);
    if (qtyError) { toast({ title: qtyError }); return; }
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
      // Only check that address is present (should always be from seller profile)
      if (!address || !address.street || !address.city || !address.state || !address.zip || !address.country) {
        setAddressError("Shipping address is incomplete. Please update it in your seller settings.");
        toast({ title: "Shipping address is incomplete. Update it in your seller settings." });
        return;
      } else {
        setAddressError(null);
      }
      if (!carrier) {
        toast({ title: "Select a carrier for paid shipping" });
        return;
      }
      if (!weight || !dimensions.length || !dimensions.width || !dimensions.height) {
        toast({ title: "Enter weight and all dimensions for paid shipping" });
        return;
      }
    }
    setPreviewOpen(true);
  }

  async function handleSubmit() {
        if (saleType === 'AUCTION' && !feeConfirmed) {
          toast({ title: "You must confirm the auction fee is non-refundable." });
          return;
        }
    // Validate required fields
    // --- Validation helpers ---
    function validateTitle(val: string): string | null {
      const titleRegex = /^[\w\d\s.,'"!?-]{4,80}$/;
      if (!val.trim()) return "Title required";
      if (val.trim().length < 4 || val.trim().length > 80) return "Title must be 4-80 characters";
      if (!titleRegex.test(val.trim())) return "Title contains invalid characters";
      return null;
    }
    function validateDescription(val: string): string | null {
      if (!val.trim()) return "Description required";
      if (val.trim().length < 10) return "Description must be at least 10 characters";
      if (val.trim().length > 2000) return "Description too long (max 2000 chars)";
      return null;
    }
    function validatePrice(val: string): string | null {
      const priceRegex = /^(?:[1-9]\d{0,4}|0)(?:\.\d{1,2})?$/;
      if (!val.trim()) return "Price required";
      if (!priceRegex.test(val.trim())) return "Price must be a valid number (max 99999.99)";
      if (parseFloat(val) <= 0) return "Price must be greater than 0";
      return null;
    }
    function validateQuantity(val: string): string | null {
      if (!val.trim()) return "Quantity required";
      const qtyNum = Number(val.trim());
      if (!Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > 999) return "Quantity must be an integer between 1 and 999";
      return null;
    }

    // --- Use helpers for validation ---
    const titleError = validateTitle(title);
    if (titleError) { toast({ title: titleError }); return; }
    const descError = validateDescription(description);
    if (descError) { toast({ title: descError }); return; }
    if (saleType === 'BUY_NOW') {
      const priceError = validatePrice(price);
      if (priceError) { toast({ title: priceError }); return; }
    }
    const qtyError = validateQuantity(quantity);
    if (qtyError) { toast({ title: qtyError }); return; }
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
      // Only check that address is present (should always be from seller profile)
      if (!address || !address.street || !address.city || !address.state || !address.zip || !address.country) {
        setAddressError("Shipping address is incomplete. Please update it in your seller settings.");
        toast({ title: "Shipping address is incomplete. Update it in your seller settings." });
        return;
      } else {
        setAddressError(null);
      }
      if (!carrier) {
        toast({ title: "Select a carrier for paid shipping" });
        return;
      }
      if (!weight || !dimensions.length || !dimensions.width || !dimensions.height) {
        toast({ title: "Enter weight and all dimensions for paid shipping" });
        return;
      }
    }
    const tagArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setUploading(true);
    try {
      const state = publishNow ? "ACTIVE" : "DRAFT";
      if (!db) {
        toast({ title: "Database not available", description: "Please try again later." });
        return;
      }
      let docRef, docId, fee = 0, netProceeds = 0, tier = sellerTier;
      let urls: string[] = [];
      // --- Edge case: check for duplicate title ---
      const listingsCol = collection(db, saleType === 'AUCTION' ? "auctions" : "listings");
      const dupQuery = query(listingsCol, where("title", "==", title.trim()), where("ownerUid", "==", user.uid));
      const dupSnap = await getDocs(dupQuery);
      if (!dupSnap.empty) {
        toast({ title: "Duplicate title detected", description: "You already have a listing or auction with this title. Please choose a unique title." });
        setUploading(false);
        return;
      }
      if (saleType === 'AUCTION') {
        // Auction validation
        if (!startingPrice) {
          toast({ title: "Starting price required" });
          setUploading(false);
          startingPriceRef.current?.focus();
          return;
        }
        if (!auctionEndsAt) {
          toast({ title: "Auction end date/time required" });
          setUploading(false);
          auctionEndsAtRef.current?.focus();
          return;
        }
        const base = parseFloat(startingPrice);
        if (isNaN(base) || base <= 0) {
          toast({ title: "Enter a valid starting price greater than 0." });
          setUploading(false);
          startingPriceRef.current?.focus();
          return;
        }
        // Reserve price validation
        if (reservePrice && (isNaN(Number(reservePrice)) || Number(reservePrice) < 0)) {
          toast({ title: "Reserve price must be a positive number" });
          setUploading(false);
          reservePriceRef.current?.focus();
          return;
        }
        if (reservePrice && Number(reservePrice) < base) {
          toast({ title: "Reserve price cannot be less than starting price" });
          setUploading(false);
          reservePriceRef.current?.focus();
          return;
        }
        // Minimum bid increment validation
        if (minBidIncrement && (isNaN(Number(minBidIncrement)) || Number(minBidIncrement) < 0.01)) {
          toast({ title: "Minimum bid increment must be at least $0.01" });
          setUploading(false);
          minBidIncrementRef.current?.focus();
          return;
        }
        // Auction duration validation: must be exactly 1, 3, or 7 days
        const now = new Date();
        const endDate = new Date(auctionEndsAt);
        const msInDay = 24 * 60 * 60 * 1000;
        const allowedDurations = [1, 3, 7];
        const diffDays = Math.round((endDate.getTime() - now.getTime()) / msInDay);
        if (endDate <= now) {
          toast({ title: "Auction end date/time must be in the future." });
          setUploading(false);
          auctionEndsAtRef.current?.focus();
          return;
        }
        if (!allowedDurations.includes(diffDays)) {
          toast({ title: "Auction duration must be exactly 1, 3, or 7 days from now." });
          setUploading(false);
          auctionEndsAtRef.current?.focus();
          return;
        }
        // Calculate auction fee
        if (tier === 'SILVER') fee = Math.max(Math.round(base * 0.05 * 100) / 100, 10);
        else if (tier === 'GOLD') fee = Math.max(Math.round(base * 0.02 * 100) / 100, 5);
        else fee = 0;
        // 1️⃣ Create auction with status 'PENDING_PAYMENT' (not visible to buyers yet)
        const auctionData: any = {
          title: title.trim(),
          description: description.trim(),
          category,
          condition,
          tags: tagArray,
          startingPrice: base,
          sellerUid: user.uid,
          storeId,
          state,
          status: publishNow ? "PENDING_PAYMENT" : "DRAFT",
          imageUrls: [],
          primaryImageUrl: "",
          shippingType,
          weight: shippingType === "PAID" ? weight : null,
          dimensions: shippingType === "PAID" ? dimensions : null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          endsAt: endDate,
          fee,
          sellerTier: tier,
        };
        if (reservePrice && !isNaN(Number(reservePrice)) && Number(reservePrice) > 0) {
          auctionData.reservePrice = Number(reservePrice);
        }
        if (minBidIncrement && !isNaN(Number(minBidIncrement)) && Number(minBidIncrement) >= 0.01) {
          auctionData.minBidIncrement = Number(minBidIncrement);
        } else {
          auctionData.minBidIncrement = 1.0; // Default $1.00
        }
        try {
          docRef = await addDoc(collection(db, "auctions"), auctionData);
          docId = docRef.id;
        } catch (e: any) {
          if (e.code === "unavailable" || e.message?.includes("Network")) {
            toast({ title: "Network error", description: "Could not connect to server. Please check your connection and try again." });
          } else {
            toast({ title: "Failed to create auction", description: e?.message || String(e) });
          }
          setUploading(false);
          return;
        }
        // After auction is created, trigger Stripe Checkout for fee payment
        if (publishNow) {
          try {
            const functions = getFunctions();
            const createAuctionFeeCheckoutSession = httpsCallable(functions, "createAuctionFeeCheckoutSession");
            const appBaseUrl = window.location.origin;
            const amountCents = Math.round(fee * 100);
            const resp: any = await createAuctionFeeCheckoutSession({
              auctionId: docId,
              auctionTitle: title.trim(),
              amountCents,
              appBaseUrl,
            });
            if (resp?.data?.url) {
              window.location.href = resp.data.url;
              return;
            } else {
              toast({ title: "Could not start payment session. Please try again or contact support." });
            }
          } catch (err) {
            console.error(err);
            toast({ title: "Auction created, but payment failed.", description: "Please try again from your dashboard." });
          }
        }
      } else {
        // Buy Now validation
        if (!price) {
          toast({ title: "Price required" });
          setUploading(false);
          return;
        }
        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice) || numericPrice <= 0) {
          toast({ title: "Price required", description: "Enter a valid price greater than 0.", variant: "destructive" });
          setUploading(false);
          return;
        }
        const numericQty = Number(quantity || "1");
        if (Number.isNaN(numericQty) || numericQty <= 0) {
          toast({ title: "Quantity required", description: "Enter a valid quantity (1 or more).", variant: "destructive" });
          setUploading(false);
          return;
        }
        // Calculate fee and net proceeds
        if (tier === "GOLD") fee = numericPrice * 0.05;
        else if (tier === "SILVER") fee = numericPrice * 0.07;
        else fee = numericPrice * 0.10;
        fee = Math.round(fee * 100) / 100;
        netProceeds = Math.round((numericPrice - fee) * 100) / 100;
        // 1️⃣ Create listing
        try {
          docRef = await addDoc(collection(db, "listings"), {
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
            fee,
            netProceeds,
            sellerTier: tier,
          });
          docId = docRef.id;
        } catch (e: any) {
          if (e.code === "unavailable" || e.message?.includes("Network")) {
            toast({ title: "Network error", description: "Could not connect to server. Please check your connection and try again." });
          } else {
            toast({ title: "Failed to create listing", description: e?.message || String(e) });
          }
          setUploading(false);
          return;
        }
      }
      // 2️⃣ Upload images
      const storage = getStorage();
      if (!storage) {
        toast({ title: "Storage not available", description: "Image upload is currently unavailable. Please try again later.", variant: "destructive" });
        setUploading(false);
        return;
      }
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const path = `listingImages/${user.uid}/${docId}/${file.name}`;
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
            (err) => {
              toast({ title: "Image upload failed", description: err?.message || String(err) });
              reject(err);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                urls.push(url);
                resolve();
              } catch (err) {
                toast({ title: "Failed to get image URL", description: (typeof err === "object" && err !== null && "message" in err) ? (err as any).message : String(err) });
                reject(err);
              }
            }
          );
        });
      }
      // 3️⃣ Update doc with images
      try {
        if (saleType === 'AUCTION') {
          await updateDoc(doc(db, "auctions", docId), {
            imageUrls: urls,
            primaryImageUrl: urls[0],
            updatedAt: serverTimestamp(),
          });
          setCreatedDocId(docId);
          setCreatedType('AUCTION');
          setSuccessModalOpen(true);
        } else {
          await updateDoc(doc(db, "listings", docId), {
            imageUrls: urls,
            primaryImageUrl: urls[0],
            updatedAt: serverTimestamp(),
          });
          setCreatedDocId(docId);
          setCreatedType('LISTING');
          setSuccessModalOpen(true);
        }
        clearFormDraft();
      } catch (e: any) {
        toast({ title: "Failed to update listing/auction with images", description: e?.message || String(e) });
        setUploading(false);
        return;
      }
      // 4️⃣ Record fee transaction for seller
      try {
        await addDoc(collection(db, "users", user?.uid ?? "", "feeTransactions"), {
          type: saleType === 'AUCTION' ? "auction-fee" : "listing-fee",
          amount: fee,
          createdAt: serverTimestamp(),
          listingTitle: title.trim(),
          sellerTier: tier,
          listingId: docId,
        });
      } catch (e: any) {
        toast({ title: "Failed to record fee transaction", description: e?.message || String(e) });
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create listing/auction" });
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

  // If user is verified, ACTIVE, but not a seller and no store, prompt to apply to become a seller
  if (user.emailVerified && userData?.status === "ACTIVE" && !isSeller && !storeId) {
    return (
      <AppLayout>
        <PlaceholderContent title="Become a seller" description="You must apply to become a seller before listing items.">
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link href="/become-seller">Apply to become a seller</Link>
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
    <ErrorBoundary>
      <AppLayout>
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Create a Listing</h1>
          <Card className="border-2 border-black bg-card/80">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" ref={titleRef} value={title} onChange={e => setTitle(e.target.value)} placeholder="Amazing Spider-Man #300 (9.8)" maxLength={80} />
              </div>
              {/* Description */}
              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  ref={descriptionRef}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  className="w-full border rounded p-2"
                  maxLength={2000}
                  placeholder="Describe your item, condition, notes, etc."
                  title="Description"
                />
              </div>
              {/* Category, Condition, Quantity, Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full border rounded p-2"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    aria-label="Category"
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
                    className="w-full border rounded p-2"
                    value={condition}
                    onChange={e => setCondition(e.target.value as any)}
                    aria-label="Condition"
                    title="Condition"
                  >
                    {CONDITION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" min={1} max={999} value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="1-999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="comma,separated,tags" />
                </div>
              </div>
              {/* Sale Type */}
              <div className="flex gap-4 mt-4">
                <Label htmlFor="sale-type-buy-now">
                  <input
                    id="sale-type-buy-now"
                    type="radio"
                    checked={saleType === 'BUY_NOW'}
                    onChange={() => setSaleType('BUY_NOW')}
                    title="Buy Now"
                  /> Buy Now
                </Label>
                <Label htmlFor="sale-type-auction">
                  <input
                    id="sale-type-auction"
                    type="radio"
                    checked={saleType === 'AUCTION'}
                    onChange={() => setSaleType('AUCTION')}
                    title="Auction"
                  /> Auction
                </Label>
              </div>
              {/* Price or Auction Fields */}
              {saleType === 'BUY_NOW' ? (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" ref={priceRef} value={price} onChange={e => setPrice(e.target.value)} placeholder="$0.00" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Starting Price</Label>
                    <Input ref={startingPriceRef} value={startingPrice} onChange={e => setStartingPrice(e.target.value)} placeholder="$0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Reserve Price (optional)</Label>
                    <Input ref={reservePriceRef} value={reservePrice} onChange={e => setReservePrice(e.target.value)} placeholder="$0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Bid Increment</Label>
                    <Input ref={minBidIncrementRef} value={minBidIncrement} onChange={e => setMinBidIncrement(e.target.value)} placeholder="$1.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Auction Ends At</Label>
                    <Input type="datetime-local" ref={auctionEndsAtRef} value={auctionEndsAt} onChange={e => setAuctionEndsAt(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      checked={feeConfirmed}
                      onCheckedChange={val => setFeeConfirmed(val === true)}
                      id="fee-confirmed"
                    />
                    <Label htmlFor="fee-confirmed">I understand the auction fee is non-refundable</Label>
                  </div>
                </div>
              )}
              {/* Image Upload */}
              <div className="mt-6">
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {imagePreviews.map((url, i) => (
                    <div key={i} className="relative w-24 h-24 border rounded overflow-hidden">
                      <img src={url} alt="Preview" className="object-cover w-full h-full" />
                      <button type="button" className="absolute top-1 right-1 bg-white/80 rounded-full p-1" onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}>×</button>
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        <button type="button" disabled={i === 0} onClick={() => moveImageUp(i)} className="text-xs px-1">↑</button>
                        <button type="button" disabled={i === images.length - 1} onClick={() => moveImageDown(i)} className="text-xs px-1">↓</button>
                      </div>
                    </div>
                  ))}
                  <label className="w-24 h-24 flex items-center justify-center border rounded cursor-pointer bg-muted/30 hover:bg-muted/50">
                    +
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>
              </div>
              {/* Shipping Section */}
              <div className="mt-6">
                <Label>Shipping</Label>
                <div className="flex gap-4 mt-2">
                  <Label htmlFor="shipping-free">
                    <input
                      id="shipping-free"
                      type="radio"
                      checked={shippingType === 'FREE'}
                      onChange={() => setShippingType('FREE')}
                      title="Free Shipping"
                    /> Free Shipping
                  </Label>
                  <Label htmlFor="shipping-paid">
                    <input
                        id="shipping-paid"
                        type="radio"
                        checked={shippingType === 'PAID'}
                        onChange={() => setShippingType('PAID')}
                        title="Buyer Pays Shipping"
                    /> Buyer Pays Shipping
                  </Label>
                </div>
                {shippingType === 'PAID' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="carrier">Carrier</Label>
                      <select
                        id="carrier"
                        className="w-full border rounded p-2"
                        value={carrier}
                        onChange={e => setCarrier(e.target.value)}
                        aria-label="Carrier"
                      >
                        <option value="">Select carrier</option>
                        {CARRIER_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (oz)</Label>
                      <Input id="weight" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 16" />
                    </div>
                    <div className="space-y-2">
                      <Label>Dimensions (inches)</Label>
                      <div className="flex gap-2">
                        <Input id="dim-length" value={dimensions.length} onChange={e => setDimensions(d => ({ ...d, length: e.target.value }))} placeholder="L" className="w-16" aria-label="Length (in)" />
                        <Input id="dim-width" value={dimensions.width} onChange={e => setDimensions(d => ({ ...d, width: e.target.value }))} placeholder="W" className="w-16" aria-label="Width (in)" />
                        <Input id="dim-height" value={dimensions.height} onChange={e => setDimensions(d => ({ ...d, height: e.target.value }))} placeholder="H" className="w-16" aria-label="Height (in)" />
                      </div>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Shipping Estimate</Label>
                      <div className="flex items-center gap-2">
                        {shippingEstimateLoading ? <Spinner size={24} aria-label="Loading shipping estimate" /> : shippingEstimate ? <span>{shippingEstimate}</span> : <span className="text-muted-foreground">Enter all fields for estimate</span>}
                        <Tooltip>
                          <TooltipTrigger><Info /></TooltipTrigger>
                          <TooltipContent>Estimate is for reference only. Actual cost may vary.</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )}
                {shippingType === 'PAID' && addressError && (
                  <div className="text-red-600 text-sm mt-2">{addressError}</div>
                )}
                {shippingType === 'PAID' && (
                  <div className="text-xs text-muted-foreground mt-2">Shipping address is managed in <Link href="/seller/settings" className="underline">Seller Settings</Link>.</div>
                )}
              </div>
              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={uploading}>Save as Draft</Button>
                <Button type="button" onClick={handlePreview} disabled={uploading}>Preview</Button>
                <Button type="button" onClick={handleSubmit} disabled={uploading}>{saleType === 'AUCTION' ? 'Publish Auction' : 'Publish Listing'}</Button>
                <Button type="button" variant="outline" onClick={() => setBulkModalOpen(true)}>Bulk Create</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Modals and dialogs */}
        {/* Preview Modal */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preview Listing</DialogTitle>
            </DialogHeader>
            {/* Preview content here, e.g. summary of fields, images, etc. */}
            <DialogFooter>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Success Modal */}
        <Dialog open={successModalOpen} onOpenChange={handleSuccessClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Listing Created!</DialogTitle>
            </DialogHeader>
            <div className="py-4">Your listing has been created successfully.</div>
            <DialogFooter>
              <Button onClick={handleSuccessClose}>Go to Listing</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Bulk Modal */}
        <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Create Listings</DialogTitle>
            </DialogHeader>
            {/* Bulk upload content here */}
            <DialogFooter>
              <Button onClick={() => setBulkModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ErrorBoundary>
  );
}