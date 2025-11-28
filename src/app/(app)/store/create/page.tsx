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
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const storeSchema = z.object({
    name: z.string().min(3, "Store name must be at least 3 characters."),
    url: z.string().min(3, "URL must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "URL can only contain lowercase letters, numbers, and hyphens."),
    aboutMe: z.string().min(10, "About me section must be at least 10 characters long."),
    paypal: z.string().email("Invalid PayPal email.").optional().or(z.literal('')),
    venmo: z.string().optional(),
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
            name: "",
            url: "",
            aboutMe: "",
            paypal: "",
            venmo: "",
        },
    });

    async function onSubmit(values: z.infer<typeof storeSchema>) {
        if (!user || !firestore) {
            toast({ title: "Error", description: "You must be logged in to create a store.", variant: "destructive" });
            return;
        }

        try {
            const newStoreRef = await addDoc(collection(firestore, "storefronts"), {
                userId: user.uid,
                name: values.name,
                url: values.url,
                aboutMe: values.aboutMe,
                logo: `https://picsum.photos/seed/${values.url}/200/200`,
                paymentPreferences: {
                    paypal: values.paypal,
                    venmo: values.venmo,
                },
                rating: 0,
                itemsSold: 0,
            });

            const userRef = doc(firestore, "users", user.uid);
            await updateDoc(userRef, { storeId: newStoreRef.id });

            toast({
                title: "Store Created!",
                description: "Your storefront is now live.",
            });
            
            router.push(`/store/${newStoreRef.id}`);

        } catch (error: any) {
            console.error("Error creating store:", error);
            toast({
                title: "Error creating store",
                description: error.message || "An unexpected error occurred.",
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
                        Your account has limited access. You cannot create a new store. Please verify your account to get full access.
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
                                    name="name"
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
                                    name="url"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store URL</FormLabel>
                                            <FormControl>
                                                 <div className="flex items-center">
                                                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">vaultverse.com/</span>
                                                    <Input placeholder="collectors-corner" {...field} className="rounded-l-none" />
                                                 </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="aboutMe"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>About Me / Store Policies</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Tell us about your store, what you sell, and any shipping/return policies." {...field} rows={5}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4 rounded-lg border p-4">
                                     <h3 className="text-lg font-medium">Payment Preferences</h3>
                                     <p className="text-sm text-muted-foreground">Enter your usernames for P2P payments. These will be shown to buyers at checkout.</p>
                                    <FormField
                                        control={form.control}
                                        name="paypal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>PayPal Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="you@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="venmo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Venmo Username</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="@your-username" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                               
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
