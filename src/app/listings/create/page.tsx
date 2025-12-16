"use client";

import { useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

export default function CreateListingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  if (!user) {
    return <div className="p-6">You must be signed in to create listings.</div>;
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setImages((prev) => [...prev, ...Array.from(files)]);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast({ title: "Missing Title", description: "Enter a title." });
      return;
    }

    if (!price || isNaN(Number(price))) {
      toast({ title: "Invalid Price", description: "Enter a valid price." });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Missing Images",
        description: "Upload at least one image.",
      });
      return;
    }

    setUploading(true);
    setUploadProgress([]);

    try {
      // Step 1: Create placeholder listing
      const listingRef = await addDoc(collection(db, "listings"), {
        title,
        description,
        price: Number(price),
        userId: user.uid,
        status: "ACTIVE",
        images: [],
        createdAt: serverTimestamp(),
      });

      const listingId = listingRef.id;

      // Step 2: Upload images to Storage /users/{uid}/listings/{listingId}/
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];

        const path = `users/${user.uid}/listings/${listingId}/${file.name}`;
        const storageRef = ref(storage, path);

        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const prog =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

              setUploadProgress((prev) => {
                const copy = [...prev];
                copy[i] = prog;
                return copy;
              });
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedUrls.push(url);
              resolve();
            }
          );
        });
      }

      // Step 3: Update listing with image URLs
      await updateDoc(doc(db, "listings", listingId), {
        images: uploadedUrls,
      });

      toast({
        title: "Listing Created",
        description: "Your listing is now active.",
      });

      router.push(`/listings/${listingId}`);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Failed to create listing.",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Create New Listing</h1>

      {/* TITLE */}
      <div className="space-y-1">
        <label className="font-semibold">Title</label>
        <Input
          placeholder="Enter listing title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* PRICE */}
      <div className="space-y-1">
        <label className="font-semibold">Price (USD)</label>
        <Input
          placeholder="10"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {/* DESCRIPTION */}
      <div className="space-y-1">
        <label className="font-semibold">Description</label>
        <Textarea
          rows={4}
          placeholder="Describe the item…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* IMAGE UPLOAD */}
      <div className="space-y-2">
        <label className="font-semibold">Images</label>
        <Input type="file" accept="image/*" multiple onChange={handleImageSelect} />

        {/* PREVIEW GRID */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {images.map((file, index) => (
              <div key={index} className="relative rounded overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-32 object-cover rounded"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 text-xs"
                  onClick={() => removeImage(index)}
                >
                  X
                </Button>

                {uploadProgress[index] != null && (
                  <div className="text-sm mt-1">
                    Upload: {uploadProgress[index].toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <Button
        onClick={handleSubmit}
        disabled={uploading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {uploading ? "Uploading…" : "Create Listing"}
      </Button>
    </div>
  );
}
