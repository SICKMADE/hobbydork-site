'use client';
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Store as StoreIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore, useUser } from "@/firebase";
import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { placeholderImages } from "@/lib/placeholder-images";

const storeSchema = z.object({
    storeName: z.string().min(3, "Store name must be at least 3 characters."),
    slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    about: z.string().min(10, "About section must be at least 10 characters long."),
});

export default function CreateStorePage() {
    const { profile } = useAuth();
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof storeSchema>>({
        resolver: zodResolver(storeSchema),
        defaultValues: {
            storeName: "",
            slug: "",
            about: "",
        },
    });

    async function onSubmit(values: z.infer<typeof storeSchema>) {
        if (!user || !firestore) {
            toast({ title: "Error", description: "You must be logged in to create a store.", variant: "destructive" });
            return;
        }

        try {
            const batch = writeBatch(firestore);

            const newStoreRef = doc(collection(firestore, "storefronts"));
            
            batch.set(newStoreRef, {
                storeId: newStoreRef.id,
                ownerUid: user.uid,
                storeName: values.storeName,
                slug: values.slug,
                about: values.about,
                avatarUrl: placeholderImages['store-logo-1']?.imageUrl || `https://picsum.photos/seed/${values.slug}/200/200`,
                ratingAverage: 0,
                ratingCount: 0,
                itemsSold: 0,
                status: "ACTIVE",
                isSpotlighted: false, 
                spotlightUntil: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            const userRef = doc(firestore, "users", user.uid);
            batch.update(userRef, { storeId: newStoreRef.id, updatedAt: serverTimestamp() });
            
            await batch.commit();

            toast({
                title: "Store Created!",
                description: "Your storefront is now live.",
            });
            
            router.push(`/store/${newStoreRef.id}`);
            router.refresh();


        } catch (error: any) {
            console.error("Error creating store:", error);
            toast({
                title: "Error Creating Store",
                description: error.code === 'permission-denied' 
                    ? 'A store with this name or slug might already exist.' 
                    : (error.message || "An unexpected error occurred."),
                variant: "destructive"
            });
        }
    }


    if (profile?.status === 'LIMITED') {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Alert variant="destructive" className="max-w-lg">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Limited Access</AlertTitle>
                      <AlertDescription>
                        Your account has limited access. You cannot create a new store. Please verify your email to get full access.
                      </AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

     if (profile?.storeId) {
        return (
             <AppLayout>
                <div className="flex items-center justify-center h-full">
                     <Alert className="max-w-lg">
                        <StoreIcon className="h-4 w-4" />
                        <AlertTitle>You already have a store!</AlertTitle>
                        <AlertDescription>
                            You can manage your store from your dashboard.
                            <Button onClick={() => router.push(`/store/${profile.storeId}`)} className="mt-4 w-full">
                                Go to My Storefront
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
             <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Create Your Storefront</CardTitle>
                        <CardDescription>
                            Set up your own corner of the VaultVerse to start selling.
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
                                                <Input placeholder="Collector's Corner" {...field} />
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
                                            <FormLabel>Store Slug</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">vaultverse.com/</span>
                                                    <Input placeholder="collectors-corner" {...field} onChange={(e) => {
                                                        const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                                        field.onChange(slug);
                                                    }}/>
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
                                                <Textarea placeholder="Tell us about your store, what you sell, and any shipping/return policies." {...field} rows={5}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            
                                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? "Creating Store..." : "Create My Store"}
                                </Button>
                            </form>
                    </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
