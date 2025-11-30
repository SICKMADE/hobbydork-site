'use client';
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFirestore } from "@/firebase";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash } from "lucide-react";
import PlaceholderContent from "@/components/PlaceholderContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import type { Condition } from "@/lib/types";
import { placeholderImages } from "@/lib/placeholder-images";
import Link from "next/link";

const listingSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    category: z.string().min(1, "Please select a category."),
    description: z.string().min(20, "Description must be at least 20 characters."),
    price: z.preprocess(
        (a) => parseFloat(z.string().parse(a)),
        z.number().positive("Price must be a positive number.")
    ),
    quantity: z.preprocess(
        (a) => parseInt(z.string().parse(a), 10),
        z.number().int().min(1, "Quantity must be at least 1.")
    ),
    condition: z.string().min(1, "Please select a condition."),
    images: z.array(z.object({ value: z.string().url("Please enter a valid image URL.") })).min(1, "At least one image is required."),
    tags: z.string().optional(),
});

const categories = ["Trading Cards", "Action Figures", "Comics", "Memorabilia", "Video Games", "Stamps"];
const conditions: { value: Condition, label: string }[] = [
    { value: "NEW", label: "New" },
    { value: "LIKE_NEW", label: "Like New" },
    { value: "VERY_GOOD", label: "Very Good" },
    { value: "GOOD", label: "Good" },
    { value: "FAIR", label: "Fair" },
    { value: "POOR", label: "Poor" },
];

export default function CreateListingPage() {
    const { profile, user } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof listingSchema>>({
        resolver: zodResolver(listingSchema),
        defaultValues: {
            title: "",
            category: "",
            description: "",
            price: 0,
            quantity: 1,
            condition: "",
            images: [{ value: "" }],
            tags: "",
        },
    });

    const { fields, append, remove } = useFieldArray({
        name: "images",
        control: form.control,
    });

    async function onSubmit(values: z.infer<typeof listingSchema>) {
        if (!profile?.storeId || !firestore || !user) {
            toast({ title: "Error", description: "You must have a store and be logged in to create a listing.", variant: "destructive" });
            return;
        }

        try {
            const listingsCollection = collection(firestore, "listings");
            const newListingRef = doc(listingsCollection);
            
            const imageUrls = values.images.map(img => img.value).filter(url => url);
            const primaryImageUrl = imageUrls[0] || placeholderImages['listing-image-1']?.imageUrl;

            // Per security rules, only ACTIVE users can create ACTIVE listings.
            // All other users' listings should start as DRAFT.
            const initialState = profile.status === 'ACTIVE' ? "ACTIVE" : "DRAFT";

            await setDoc(newListingRef, {
                listingId: newListingRef.id,
                storeId: profile.storeId,
                ownerUid: user.uid,
                title: values.title,
                category: values.category,
                description: values.description,
                price: values.price,
                condition: values.condition,
                quantityTotal: values.quantity,
                quantityAvailable: values.quantity,
                state: initialState,
                tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
                imageUrls: imageUrls.length > 0 ? imageUrls : [primaryImageUrl],
                primaryImageUrl: primaryImageUrl,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast({
                title: "Listing Created!",
                description: `Your new item has been saved as a ${initialState.toLowerCase()}.`,
            });
            
            router.push('/listings');

        } catch (error: any) {
            console.error("Error creating listing:", error);
            toast({
                title: "Error Creating Listing",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        }
    }
    
    if (!profile?.isSeller) {
        return (
            <AppLayout>
                <PlaceholderContent 
                    title="You are not a seller"
                    description="You need to create a store before you can add listings."
                >
                    <Button asChild className="mt-4">
                        <Link href="/store/create">Create a Store</Link>
                    </Button>
                </PlaceholderContent>
            </AppLayout>
        )
    }

    if (profile.status !== 'ACTIVE') {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Alert variant="destructive" className="max-w-lg">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Account Not Fully Active</AlertTitle>
                      <AlertDescription>
                        Your account must be active to create listings that are immediately visible. You can still create listings, but they will be saved as drafts. Please verify your email.
                      </AlertDescription>
                    </Alert>
                </div>
                 <div className="max-w-2xl mx-auto mt-8">
                     <ListingForm />
                 </div>
            </AppLayout>
        );
    }

    const ListingForm = () => (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">Create a New Listing</CardTitle>
                <CardDescription>
                    Fill out the details below to add a new item to your store.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Listing Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Holographic Charizard Card" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a condition" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {conditions.map(con => <SelectItem key={con.value} value={con.value}>{con.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                            <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe your item in detail..." {...field} rows={5}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="25.00" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                                <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>Total number of this item you have for sale.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <div>
                            <FormLabel>Images</FormLabel>
                            <FormDescription className="mb-2">
                                Add at least one image URL. The first image will be the main one.
                            </FormDescription>
                            <div className="space-y-4">
                            {fields.map((field, index) => (
                                <FormField
                                    key={field.id}
                                    control={form.control}
                                    name={`images.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                {fields.length > 1 && (
                                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ value: "" })}>
                                Add Another Image
                            </Button>
                        </div>
                        
                            <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                        <Input placeholder="e.g., pokemon, vintage, rare" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Comma-separated keywords to help buyers find your item.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Creating Listing..." : "Create Listing"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                 <ListingForm />
            </div>
        </AppLayout>
    );
}

    