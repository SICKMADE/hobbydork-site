"use client";
import { useState } from "react";
import { storage } from "@/firebase/client-provider";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";
import { createGiveaway } from "@/lib/storeGiveaway";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AppLayout from "@/components/layout/AppLayout";

export default function StoreGiveawayCreatePage() {
  const { user, profile } = useAuth();
  const params = useParams();
  const storeId = params?.id as string;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only allow sellers with a store
  const isSeller = profile?.isSeller && profile?.storeId;

  if (!user || !isSeller) {
    return <AppLayout><div className="p-8 text-center">Only sellers with a store can create giveaways.</div></AppLayout>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    let finalImageUrl = imageUrl;
    try {
      if (imageFile && storage) {
        setImageUploading(true);
        const fileRef = ref(storage, `giveaways/${storeId}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        finalImageUrl = await getDownloadURL(fileRef);
        setImageUploading(false);
      }
      await createGiveaway({
        storeId,
        ownerUid: user.uid,
        title,
        description,
        imageUrl: finalImageUrl,
        prize,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
      });
      router.push(`/store/${storeId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create giveaway");
    } finally {
      setSubmitting(false);
      setImageUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Store Giveaway</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div>
                <Label>Prize</Label>
                <Input value={prize} onChange={e => setPrize(e.target.value)} required />
              </div>
              <div>
                <Label>Image (optional)</Label>
                <Input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  setImageFile(file || null);
                  setImageUrl("");
                }} />
                {imageFile && <div className="text-xs text-muted-foreground">Selected: {imageFile.name}</div>}
                <div className="text-xs text-muted-foreground">Or paste image URL:</div>
                <Input value={imageUrl} onChange={e => {
                  setImageUrl(e.target.value);
                  setImageFile(null);
                }} placeholder="https://..." />
                {imageUploading && <div className="text-xs text-blue-600">Uploading image...</div>}
              </div>
              <div>
                <Label>Start Date/Time</Label>
                <Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required />
              </div>
              <div>
                <Label>End Date/Time</Label>
                <Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} required />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Giveaway"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
