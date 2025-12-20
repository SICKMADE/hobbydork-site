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
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ISO24_CATEGORY_OPTIONS, type Iso24Category } from "@/lib/iso24";

export default function CreateISO() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<Iso24Category>("OTHER");
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
      category,
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

  if (!user)
    return (
      <AppLayout>
        <div className="p-6">Sign in required.</div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Create ISO24</h1>
          <p className="text-sm text-muted-foreground">
            Post what you’re looking for. The community has 24 hours to help you find it.
          </p>
        </div>

        <Card className="border-2 border-black bg-card/80 shadow-[3px_3px_0_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                void makeIso();
              }}
            >
              <div className="space-y-2">
                <Label>What are you looking for?</Label>
                <Input
                  placeholder="Example: Amazing Spider-Man #300 (9.8)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Iso24Category)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISO24_CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  rows={5}
                  placeholder="Condition, budget, variants, trade/buy, etc."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Image (optional)</Label>
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

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black bg-muted/40 hover:bg-muted/60"
                  onClick={() => router.push("/iso24")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="comic-button">
                  {submitting ? "Submitting…" : "Post ISO"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
