'use client';

import React, { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useForm, FormProvider } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AnimatePresence, motion } from 'framer-motion';

const storeSchema = z.object({
    storeName: z.string().min(3, "Store name must be at least 3 characters long."),
    slug: z.string().min(3, "URL slug must be at least 3 characters long.")
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    about: z.string().min(10, "About section must be at least 10 characters long."),
});

const paymentSchema = z.object({
    paymentMethod: z.enum(["PAYPAL", "VENMO"], { required_error: "Please select a payment method." }),
    paymentIdentifier: z.string().min(3, "Please enter your payment username or email."),
});

const combinedSchema = storeSchema.merge(paymentSchema);

type OnboardingValues = z.infer<typeof combinedSchema>;

const StepStoreDetails = () => {
    const { control, watch, setValue } = useFormContext<OnboardingValues>();
    const storeNameValue = watch("storeName");

    React.useEffect(() => {
        const slug = (storeNameValue || "")
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        setValue("slug", slug, { shouldValidate: true });
    }, [storeNameValue, setValue]);

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
            <FormField
                control={control}
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
                control={control}
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
                        <FormDescription>This will be your store's unique URL.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
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
        </motion.div>
    );
}

const StepPaymentDetails = () => {
     const { control } = useFormContext<OnboardingValues>();
    return (
         <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
             <FormField
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Preferred Payment Method</FormLabel>
                     <FormDescription>This is how buyers will pay you. We currently support peer-to-peer payments via PayPal or Venmo.</FormDescription>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="PAYPAL" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            PayPal
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="VENMO" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Venmo
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name="paymentIdentifier"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Identifier</FormLabel>
                        <FormControl>
                            <Input placeholder="Your PayPal.Me link, email, or Venmo username" {...field} />
                        </FormControl>
                         <FormDescription>
                            This will be shown to buyers at checkout. Make sure it's correct!
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </motion.div>
    )
}


export default function OnboardingPage() {
    const { user, profile } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<OnboardingValues>({
        resolver: zodResolver(combinedSchema),
        defaultValues: {
            storeName: "",
            slug: "",
            about: "",
            paymentMethod: undefined,
            paymentIdentifier: "",
        },
    });

    const handleNext = async () => {
        const isStepValid = await methods.trigger(["storeName", "slug", "about"]);
        if (isStepValid) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    async function onSubmit(values: OnboardingValues) {
        if (!user || !firestore || !profile) {
            toast({ title: "Error", description: "You must be logged in to complete onboarding.", variant: "destructive" });
            return;
        }

        if (profile.storeId) {
             router.push('/');
             return;
        }

        setIsSubmitting(true);
        try {
            // Transaction to create store and update user
            await runTransaction(firestore, async (transaction) => {
                const newStoreRef = doc(collection(firestore, "storefronts"));
                const userProfileRef = doc(firestore, "users", user.uid);

                // 1. Create the new store document
                transaction.set(newStoreRef, {
                    storeId: newStoreRef.id,
                    ownerUid: user.uid,
                    storeName: values.storeName,
                    slug: values.slug,
                    about: values.about,
                    avatarUrl: placeholderImages['store-logo-1']?.imageUrl,
                    ratingAverage: 0,
                    ratingCount: 0,
                    itemsSold: 0,
                    status: "ACTIVE",
                    isSpotlighted: false,
                    spotlightUntil: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                // 2. Update the user's profile with the new storeId and payment info
                transaction.update(userProfileRef, {
                    storeId: newStoreRef.id,
                    paymentMethod: values.paymentMethod,
                    paymentIdentifier: values.paymentIdentifier,
                    updatedAt: serverTimestamp(),
                });
            });

            toast({
                title: "Setup Complete!",
                description: "Welcome to VaultVerse! Your store is now live.",
            });

            router.push('/');
            router.refresh();

        } catch (error: any) {
            console.error("Error during onboarding:", error);
            toast({
                title: "Onboarding Failed",
                description: error.message || "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (!user || !profile || profile.storeId) {
        if (typeof window !== 'undefined') router.push('/');
        return <div className="flex items-center justify-center h-screen">Redirecting...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Welcome to VaultVerse!</CardTitle>
                        <CardDescription>
                            Let's get your account and store set up. (Step {step} of 2)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FormProvider {...methods}>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && <StepStoreDetails key="step1" />}
                                    {step === 2 && <StepPaymentDetails key="step2" />}
                                </AnimatePresence>
                                <div className="flex justify-between mt-8">
                                    {step === 1 ? (
                                         <div></div>
                                    ) : (
                                        <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                            Back
                                        </Button>
                                    )}
                                    
                                    {step === 1 ? (
                                        <Button type="button" onClick={handleNext}>
                                            Next: Payment Details
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? "Finishing Up..." : "Complete Setup"}
                                        </Button>
                                    )}
                                </div>
                            </form>
                       </FormProvider>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
