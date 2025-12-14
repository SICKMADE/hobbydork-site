
'use client';

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const profileSchema = z.object({
  about: z
    .string()
    .max(800, "About me must be 800 characters or less.")
    .optional()
    .or(z.literal("")),
});

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    (profile as any)?.avatar || undefined
  );

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      about: (profile as any)?.about || "",
    },
  });

  async function uploadAvatarIfNeeded(): Promise<string | undefined> {
    if (!user || !avatarFile) return (profile as any)?.avatar || undefined;

    try {
      const storage = getStorage();
      const safeName = avatarFile.name.replace(/[^\w.-]/g, "_");
      const avatarRef = ref(
        storage,
        `avatars/${user.uid}/${Date.now()}-${safeName}`
      );

      const snapshot = await uploadBytes(avatarRef, avatarFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Avatar upload failed",
        description:
          error?.message || "Could not upload your profile picture.",
      });
      throw error;
    }
  }

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !firestore) return;
    setIsSubmitting(true);

    try {
      const userRef = doc(firestore, "users", user.uid);

      const newAvatarUrl = await uploadAvatarIfNeeded();

      const payload: Record<string, any> = {
        about: values.about ?? "",
      };

      if (newAvatarUrl !== undefined) {
        payload.avatar = newAvatarUrl;
      }

      await updateDoc(userRef, payload);

      if (newAvatarUrl) {
        setAvatarPreview(newAvatarUrl);
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      // uploadAvatarIfNeeded already toasts upload failures
      if (!error?.message?.includes("upload")) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: error?.message || "Could not update your profile.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!profile) {
    return (
      <AppLayout>
        <div>Loading profile...</div>
      </AppLayout>
    );
  }

  const displayName = profile.displayName || "";
  const email = (profile as any).email || "";

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Avatar className="mx-auto mb-4 h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={avatarPreview} alt={displayName} />
              <AvatarFallback className="text-3xl">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl">{displayName}</CardTitle>
            {email && <CardDescription>{email}</CardDescription>}
            {(profile as any)?.about && (
              <p className="mt-3 text-sm text-muted-foreground">
                {(profile as any).about}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Display name (read-only) */}
                <div className="space-y-2">
                  <Label>Display name</Label>
                  <Input value={displayName} disabled readOnly />
                  <p className="text-sm text-muted-foreground">
                    Usernames are permanent and cannot be changed.
                  </p>
                </div>

                {/* Avatar file upload (PFP) */}
                <div className="space-y-2">
                  <FormLabel>Profile picture</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setAvatarFile(file || null);
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setAvatarPreview(url);
                      } else {
                        setAvatarPreview((profile as any)?.avatar || undefined);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose an image from your device. It will be uploaded and
                    stored in Firebase Storage when you save.
                  </p>
                </div>

                {/* About me */}
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About me</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={5}
                          placeholder="Tell people who you are, what you collect, and what you’re looking for on VaultVerse."
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        This will show on your profile and storefront. Max 800
                        characters.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
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
