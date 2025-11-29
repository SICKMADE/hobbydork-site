

'use client';
import React from 'react';
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { placeholderImages } from "@/lib/placeholder-images";


const storeSchema = z.object({
    storeName: z.string().min(3, "Store name must be at least 3 characters long."),
    slug: z.string().min(3, "URL slug must be at least 3 characters long.")
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    about: z.string().min(10, "About section must be at least 10 characters long."),
    avatarUrl: z.string().url("Please enter a valid URL for the store avatar.").optional().or(z.literal('')),
});

export default function CreateStorePage() {
    const { profile, user } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof storeSchema>>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            storeName: "",
            slug: "",
            about: "",
            avatarUrl: "",
        },
    });
    
    const storeNameValue = form.watch("storeName");

    // Effect to auto-generate slug from store name
    React.useEffect(() => {
        const slug = storeNameValue
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^a-z0-9-]/g, ''); // Remove invalid chars
        form.setValue("slug", slug, { shouldValidate: true });
    }, [storeNameValue, form]);


    async function onSubmit(values: z.infer<typeof storeSchema>) {
        if (!user || !firestore) {
            toast({ title: "Error", description: "You must be logged in to create a store.", variant: "destructive" });
            return;
        }

        try {
            // 1. Create the new store document
            const newStoreRef = doc(collection(firestore, "storefronts"));
            await setDoc(newStoreRef, {
                storeId: newStoreRef.id,
                ownerUid: user.uid,
                storeName: values.storeName,
                slug: values.slug,
                about: values.about,
                avatarUrl: values.avatarUrl || placeholderImages['store-logo-1']?.imageUrl,
                ratingAverage: 0,
                ratingCount: 0,
                itemsSold: 0,
                status: "ACTIVE",
                isSpotlighted: false, 
                spotlightUntil: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            // 2. Update the user's profile with the new storeId
            const userProfileRef = doc(firestore, "users", user.uid);
            await updateDoc(userProfileRef, {
                storeId: newStoreRef.id,
                updatedAt: serverTimestamp(),
            });

            toast({
                title: "Store Created!",
                description: `Your store "${values.storeName}" is now live.`,
            });
            
            router.push('/');
            router.refresh(); // Refresh to update sidebar, etc.

        } catch (error: any) {
            console.error("Error creating store:", error);
            toast({
                title: "Error Creating Store",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        }
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Create Your Store</CardTitle>
                        <CardDescription>
                            Set up your personal storefront to start selling collectibles.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                <FormField
                                    control={form.control}
                                    name="storeName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Galactic Treasures" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store URL</FormLabel>
                                            <FormControl>
                                                 <div className="flex items-center">
                                                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                                                        vaultverse.com/store/
                                                    </span>
                                                    <Input placeholder="galactic-treasures" {...field} className="rounded-l-none" />
                                                </div>
                                            </FormControl>
                                            <FormDescription>This will be your store's unique URL. Use lowercase letters, numbers, and hyphens only.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="about"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>About Your Store</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Tell everyone what makes your store special..." {...field} rows={5}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="avatarUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store Avatar Image URL (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." {...field} />
                                            </FormControl>
                                             <FormDescription>Link to an image for your store's logo or avatar.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Creating Store..." : "Create Store"}
                                </Button>
                            </form>
                       </Form>
                    </CardContent>
                 </Card>
            </div>
        </AppLayout>
    );
}
