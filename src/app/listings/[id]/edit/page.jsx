"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

import { db, storage } from "@/firebase/client-provider";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function EditListingPage({ params }: { params: { id: string } }) {
  const listingId = params.id;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [listing, setListing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadListing() {
      const refDoc = doc(db, "listings", listingId);
      const snap = await getDoc(refDoc);

      if (!snap.exists()) {
        toast({ title: "Error", description: "Listing not found." });
        router.push("/listings");
        return;
      }

      const data = snap.data();
      setListing({ id: listingId, ...data });
      setTitle(data.title);
      setPrice(data.price);
      setDescription(data.description || "");
      setExistingImages(data.images || []);
      setLoading(false);
    }

    loadListing();
  }, [listingId]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setNewImages((prev) => [...prev, ...Array.from(files)]);
  }

  async function handleRemoveExistingImage(url: string) {
    if (!user) return;

    try {
      // Remove from Firestore array
      const filtered = existingImages.filter((img) => img !== url);
      setExistingImages(filtered);

      // Delete from Storage
      const filePath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
      const fileRef = ref(storage, filePath);

      await deleteObject(fileRef);

      toast({ title: "Removed", description: "Image deleted successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Could not delete image." });
    }
  }

  async function handleSave() {
    if (!user || !listing) return;

    if (listing.userId !== user.uid) {
      toast({
        title: "Unauthorized",
        description: "You cannot edit someone else’s listing.",
      });
      return;
    }

    if (listing.status === "SOLD") {
      toast({
        title: "Not Allowed",
        description: "You cannot edit a sold listing.",
      });
      return;
    }

    if (!title.trim()) {
      toast({ title: "Missing Title" });
      return;
    }

    if (!price || isNaN(Number(price))) {
      toast({ title: "Invalid price" });
      return;
    }

    setSaving(true);

    try {
      const newImageUrls: string[] = [];

      // Upload new images
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];

        const path = `users/${user.uid}/listings/${listingId}/${file.name}`;
        const storageRef = ref(storage, path);

        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress((prev) => {
                const copy = [...prev];
                copy[i] = progress;
                return copy;
              });
            },
            reject,
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              newImageUrls.push(url);
              resolve();
            }
          );
        });
      }

      // Update Firestore listing
      await updateDoc(doc(db, "listings", listingId), {
        title,
        price: Number(price),
        description,
        images: [...existingImages, ...newImageUrls],
      });

      toast({ title: "Saved", description: "Listing updated." });
      router.push(`/listings/${listingId}`);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Could not update listing.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-4">Edit Listing</h1>

      {/* TITLE */}
      <div className="space-y-1">
        <label className="font-semibold">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* PRICE */}
      <div className="space-y-1">
        <label className="font-semibold">Price (USD)</label>
        <Input
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* EXISTING IMAGES */}
      <div className="space-y-2">
        <label className="font-semibold">Existing Images</label>
        {existingImages.length === 0 && <p>No images yet.</p>}

        <div className="grid grid-cols-3 gap-4">
          {existingImages.map((url, index) => (
            <div key={index} className="relative rounded overflow-hidden">
              <img src={url} className="w-full h-32 object-cover rounded" />

              <Button
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 text-xs"
                onClick={() => handleRemoveExistingImage(url)}
              >
                X
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* NEW IMAGES */}
      <div className="space-y-2">
        <label className="font-semibold">Add More Images</label>
        <Input type="file" accept="image/*" multiple onChange={handleImageSelect} />

        {newImages.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {newImages.map((file, index) => (
              <div key={index} className="relative rounded overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  className="w-full h-32 object-cover rounded"
                />

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

      {/* SAVE BUTTON */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {saving ? "Saving…" : "Save Changes"}
      </Button>
    </div>
  );
}
