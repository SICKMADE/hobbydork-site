'use client';

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/firebase/client-provider";
import { getDefaultAvatarUrl } from "@/lib/default-avatar";

const profileSchema = z.object({
  about: z
    .string()
    .max(800, "About me must be 800 characters or less.")
    .optional()
    .or(z.literal("")),
});

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const DEFAULT_AVATAR = getDefaultAvatarUrl(user?.uid);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      about: "",
    },
  });

  if (loading) {
    return (
      <AppLayout>
        <div>Loading profile...</div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div>Profile not available.</div>
      </AppLayout>
    );
  }

  async function uploadAvatarIfNeeded(): Promise<string | undefined> {
    if (!avatarFile) return user?.photoURL ?? undefined;

    if (!user) return undefined;

    const storage = getStorage();
    const safeName = avatarFile.name.replace(/[^\w.-]/g, "_");
    const avatarRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${safeName}`);

    const snapshot = await uploadBytes(avatarRef, avatarFile);
    return getDownloadURL(snapshot.ref);
  }

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) return;
    if (!db) return;
    setIsSubmitting(true);
    try {
      const userRef = doc(db!, "users", user.uid);
      const newAvatarUrl = await uploadAvatarIfNeeded();

      const payload: Record<string, any> = {
        about: values.about ?? "",
      };

      if (newAvatarUrl) payload.avatar = newAvatarUrl;

      await updateDoc(userRef, payload);

      if (newAvatarUrl) setAvatarPreview(newAvatarUrl);

      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err?.message || "Could not update profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayName = user.displayName || "";
  const email = user.email || "";

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="mx-auto mb-4 h-24 w-24">
              <AvatarImage
                src={avatarPreview || DEFAULT_AVATAR}
                alt={displayName}
              />
              <AvatarFallback />
            </Avatar>

            <CardTitle className="text-3xl">{displayName}</CardTitle>
            {email && <CardDescription>{email}</CardDescription>}
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={displayName} disabled readOnly />
                </div>

                <div className="space-y-2">
                  <FormLabel>Profile picture</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file);
                      if (file) {
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About me</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
