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
import Spinner from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export default function CreateListingPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  if (!user) {
    return <div className="p-6">You must be signed in.</div>;
  }

  if (userData && !userData.isSeller) {
    return (
      <div className="p-6">
        You must set up a store first.
        <br />
        <a href="/store/create" className="text-blue-600 underline">
          Set up store
        </a>
      </div>
    );
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    setImages((prev) => [...prev, ...Array.from(e.target.files!)]);
  }

  async function handleSubmit() {
    if (!title.trim() || !price) {
      toast({ title: "Missing fields" });
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

    setUploading(true);

    try {
      // 1️⃣ Create listing
      const listingRef = await addDoc(collection(db, "listings"), {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        ownerUid: user.uid,
        storeId: userData?.storeId,
        state: "ACTIVE",
        quantityAvailable: 1,
        images: [],
        primaryImageUrl: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const listingId = listingRef.id;
      const urls: string[] = [];

      // 2️⃣ Upload images
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const path = `users/${user.uid}/listings/${listingId}/${file.name}`;
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
        images: urls,
        primaryImageUrl: urls[0],
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Create Listing</h1>

      <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Textarea rows={4} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

      <Input type="file" multiple accept="image/*" onChange={handleImageSelect} />

      <Button onClick={handleSubmit} disabled={uploading} className="w-full">
        {uploading ? <Spinner size={20} /> : "Create Listing"}
      </Button>
    </div>
  );
}
