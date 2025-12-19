"use client";

import { useState } from "react";
import { db } from "@/firebase/client-provider";
import { storage } from "@/firebase/client-provider";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, serverTimestamp, Timestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CreateISO() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onPickImage(file: File | null) {
    setImageFile(file);

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    if (file) {
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  }

  async function makeIso() {
    if (!user) return;
    if (!title.trim()) return;

    if (imageFile && !storage) {
      toast({
        title: "Uploads unavailable",
        description: "Storage is not ready yet. Refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));

    const docRef = await addDoc(collection(db, "iso24Posts"), {
      ownerUid: user.uid,
      title,
      description: desc,
      imageUrl: null,
      status: "OPEN",
      createdAt: serverTimestamp(),
      expiresAt,
    });

    try {
      if (imageFile) {
        const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `iso24Images/${user.uid}/${docRef.id}/${Date.now()}-${safeName}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(storageRef);
        await updateDoc(docRef, { imageUrl: url, updatedAt: serverTimestamp() });
      }
    } catch (e: any) {
      // ISO is created; image is optional.
      toast({
        title: "Image upload failed",
        description: e?.message ?? "Your ISO was created, but the image failed to upload.",
        variant: "destructive",
      });
    }

    toast({ title: "ISO Created" });
    router.push("/iso24");
  }

  if (!user) return <div className="p-6">Sign in required.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create ISO</h1>

      <Input
        placeholder="What are you looking for?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        rows={4}
        placeholder="Describe your ISO"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <div className="space-y-2">
        <div className="text-sm font-medium">Image (optional)</div>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
        />
        {imagePreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreviewUrl}
            alt="Selected ISO image"
            className="w-full max-h-[360px] object-contain rounded-md border bg-muted"
          />
        )}
      </div>

      <Button onClick={makeIso} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit"}
      </Button>
    </div>
  );
}
