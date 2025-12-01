
'use client';
import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, Timestamp, orderBy, doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { ISO24 } from "@/lib/types";
import ISO24Card from "@/components/ISO24Card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

const isoSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters."),
    category: z.string().min(1, "Please select a category."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    imageUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

const categories = ["Trading Cards", "Action Figures", "Comics", "Memorabilia", "Video Games", "Stamps"];

export default function ISO24Page() {
    const { profile, user, loading: authLoading } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof isoSchema>>({
        resolver: zodResolver(isoSchema),
        defaultValues: {
            title: "",
            category: "",
            description: "",
            imageUrl: "",
        },
    });

    const isoQuery = useMemoFirebase(() => {
        if (!firestore || !profile || profile.status !== 'ACTIVE') return null;
        return query(
            collection(firestore, 'iso24Posts'),
            where('status', '==', 'ACTIVE'),
            orderBy('expiresAt', 'desc')
        );
    }, [firestore, profile]);

    const { data: isoPosts, isLoading: postsLoading } = useCollection<ISO24>(isoQuery);

    const activePosts = React.useMemo(() => {
      if (!isoPosts) return [];
      const now = new Date();
      return isoPosts.filter((post) => {
        if (!post.expiresAt) return false;
        return post.expiresAt.toDate() > now;
      });
    }, [isoPosts]);

    const userPostsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'iso24Posts'),
            where('creatorUid', '==', user.uid),
            where('status', '==', 'ACTIVE'),
            where('expiresAt', '>', Timestamp.now())
        );
    }, [firestore, user]);
    
    const { data: userActivePosts } = useCollection<ISO24>(userPostsQuery);


    async function onSubmit(values: z.infer<typeof isoSchema>) {
        if (!user || !profile || !firestore) {
            toast({ title: "Error", description: "You must be logged in to create a post.", variant: "destructive" });
            return;
        }

        if (profile.status !== 'ACTIVE') {
            toast({ title: "Account Not Active", description: "Your account must be active to create ISO posts.", variant: "destructive" });
            return;
        }
        
        if (userActivePosts && userActivePosts.length >= 3) {
            toast({ title: "Post Limit Reached", description: "You can only have 3 active ISO posts at a time.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const now = serverTimestamp();
            const expires = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);
            const docRefCollection = collection(firestore, "iso24Posts");
            const newDocRef = doc(docRefCollection)

            await setDoc(newDocRef, {
                id: newDocRef.id,
                creatorUid: user.uid,
                title: values.title,
                category: values.category,
                description: values.description,
                imageUrl: values.imageUrl || null,
                createdAt: now,
                expiresAt: expires,
                status: 'ACTIVE',
            });
            
            toast({
                title: "ISO Post Created!",
                description: "Your post is now live for 24 hours.",
            });
            form.reset();
        } catch (error: any) {
            console.error("Error creating ISO post:", error);
            toast({
                title: "Error Creating Post",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (authLoading) {
        return <AppLayout><div className="flex items-center justify-center h-full">Loading...</div></AppLayout>;
    }

    if (profile?.status !== 'ACTIVE') {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-full">
                    <Alert variant="destructive" className="max-w-lg">
                      <Terminal className="h-4 w-4" />
                      <AlertTitle>Account Not Active</AlertTitle>
                      <AlertDescription>
                        Your account must be active to view or create ISO posts. This might be because your email is not verified or your account is suspended.
                      </AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create an ISO Post</CardTitle>
                            <CardDescription>Looking for a specific item? Post it here for 24 hours.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Item Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Rare Pikachu Card" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
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
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Describe the item you're looking for..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Image URL (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com/image.png" {...field} />
                                                </FormControl>
                                                <FormDescription>A direct link to an image of the item.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? "Posting..." : "Create Post"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">You have {3 - (userActivePosts?.length || 0)} posts remaining.</p>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                     <h2 className="text-2xl font-bold mb-4">Active ISO Posts</h2>
                     {postsLoading && <p>Loading posts...</p>}
                     {!postsLoading && activePosts && activePosts.length > 0 ? (
                        <div className="space-y-4">
                            {activePosts.map(post => <ISO24Card key={post.id} post={post} />)}
                        </div>
                     ) : (
                        !postsLoading && <p className="text-muted-foreground">No active ISO posts right now. Be the first to create one!</p>
                     )}
                </div>
            </div>
        </AppLayout>
    );
}
