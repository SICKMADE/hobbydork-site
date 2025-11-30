
'use client';
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getInitials } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
    avatar: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
});

export default function ProfilePage() {
    const { profile, user } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        values: {
            avatar: profile?.avatar || '',
        },
    });

    async function onSubmit(values: z.infer<typeof profileSchema>) {
        if (!user || !firestore) return;
        setIsSubmitting(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                avatar: values.avatar,
            });
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved.",
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: error.message || "Could not update your profile.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!profile) {
        return <AppLayout><div>Loading profile...</div></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
                            <AvatarImage src={form.watch('avatar')} alt={profile.displayName || ''} />
                            <AvatarFallback className="text-3xl">{getInitials(profile.displayName)}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-3xl">{profile.displayName}</CardTitle>
                        <CardDescription>{profile.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Display Name</Label>
                                    <Input value={profile.displayName || ''} disabled readOnly />
                                    <p className="text-sm text-muted-foreground">Usernames are permanent and cannot be changed.</p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="avatar"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Avatar URL</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
