

'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';

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

const agreementsSchema = z.object({
    agreeGoodsAndServices: z.literal(true, { errorMap: () => ({ message: "You must agree to use Goods & Services." })}),
    agreeTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms." })}),
    agreeAge: z.literal(true, { errorMap: () => ({ message: "You must confirm you are 18 or older." })}),
    agreeOneAccount: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the one account rule." })}),
});

const onboardingSchema = storeSchema.merge(paymentSchema).merge(agreementsSchema);

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const Step1Store = () => {
    const { control, watch, setValue } = useFormContext<OnboardingFormValues>();
    const storeNameValue = watch("storeName");

    React.useEffect(() => {
        if (storeNameValue) {
            const slug = storeNameValue
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            setValue("slug", slug, { shouldValidate: true });
        }
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
                                    vaultverse.app/store/
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
                            <Textarea placeholder="Tell everyone what makes your store special..." {...field} rows={3}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </motion.div>
    );
}

const Step2Payment = () => {
    const { control } = useFormContext<OnboardingFormValues>();
    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
             <FormField
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Preferred Payment Method</FormLabel>
                     <FormDescription>Required to receive payments. VaultVerse never holds funds.</FormDescription>
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
                        <FormLabel>PayPal Email or Venmo Handle</FormLabel>
                        <FormControl>
                            <Input placeholder="Your PayPal email or Venmo username" {...field} />
                        </FormControl>
                         <FormDescription>
                            This will be shown to buyers at checkout. Make sure it's correct!
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </motion.div>
    );
};

const Step3Agreements = () => {
    const { control } = useFormContext<OnboardingFormValues>();
    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <div className="space-y-4">
                 <FormField
                    control={control}
                    name="agreeGoodsAndServices"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I agree to use Goods & Services for all transactions for my own protection.</FormLabel>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="agreeTerms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                I agree to the <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.
                            </FormLabel>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="agreeAge"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I confirm I am at least 18 years old.</FormLabel>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name="agreeOneAccount"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>I understand only one account is allowed per person.</FormLabel>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
            </div>
        </motion.div>
    );
};

export default function OnboardingPage() {
    const { user, profile } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(
            step === 1 ? storeSchema :
            step === 2 ? paymentSchema :
            onboardingSchema
        ),
        mode: "onChange",
        defaultValues: {
            storeName: profile?.displayName || "",
            slug: "",
            about: "",
            paymentMethod: "PAYPAL",
            paymentIdentifier: "",
            agreeGoodsAndServices: false,
            agreeTerms: false,
            agreeAge: false,
            agreeOneAccount: false,
        }
    });

    const handleNext = async () => {
        let fieldsToValidate: (keyof OnboardingFormValues)[] = [];
        if (step === 1) {
            fieldsToValidate = ['storeName', 'slug', 'about'];
        } else if (step === 2) {
            fieldsToValidate = ['paymentMethod', 'paymentIdentifier'];
        }

        const isValid = await methods.trigger(fieldsToValidate);
        if (isValid) {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    async function onSubmit(values: OnboardingFormValues) {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You are not properly signed in.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const newStoreRef = doc(collection(firestore, "storefronts"));
                const userProfileRef = doc(firestore, "users", user.uid);
                
                // 1. Update the user document
                transaction.update(userProfileRef, {
                    displayName: values.storeName,
                    storeId: newStoreRef.id,
                    paymentMethod: values.paymentMethod,
                    paymentIdentifier: values.paymentIdentifier,
                    goodsAndServicesAgreed: values.agreeGoodsAndServices,
                    oneAccountAcknowledged: values.agreeOneAccount,
                    updatedAt: serverTimestamp(),
                });

                // 2. Create the store document
                transaction.set(newStoreRef, {
                    id: newStoreRef.id, // Explicitly set the document ID as a field
                    storeId: newStoreRef.id,
                    ownerUid: user.uid,
                    storeName: values.storeName,
                    slug: values.slug,
                    about: values.about,
                    avatarUrl: placeholderImages['store-logo-1']?.imageUrl || `https://picsum.photos/seed/${values.slug}/128/128`,
                    ratingAverage: 0,
                    ratingCount: 0,
                    itemsSold: 0,
                    status: "ACTIVE",
                    isSpotlighted: false,
                    spotlightUntil: null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            });

            toast({
                title: 'Welcome to VaultVerse!',
                description: 'Your store is now live. Happy selling!',
            });
            
            router.push('/');
            router.refresh();

        } catch (error: any) {
             console.error("Onboarding failed:", error);
            toast({
                title: 'Onboarding Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const stepDetails = [
        { title: "Set Up Your Store", description: "This will be your public identity on VaultVerse.", schema: storeSchema },
        { title: "Set Up Payments", description: "Choose how you want to get paid by buyers.", schema: paymentSchema },
        { title: "Final Agreements", description: "Please review and agree to the following terms.", schema: agreementsSchema },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-8 flex justify-center">
                    <Logo />
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{stepDetails[step - 1].title}</CardTitle>
                        <CardDescription>
                            Step {step} of 3: {stepDetails[step - 1].description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FormProvider {...methods}>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && <Step1Store key="step1" />}
                                    {step === 2 && <Step2Payment key="step2" />}
                                    {step === 3 && <Step3Agreements key="step3" />}
                                </AnimatePresence>
                                <div className="flex justify-between mt-8">
                                    {step > 1 ? (
                                        <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                            Back
                                        </Button>
                                    ) : <div />}
                                    
                                    {step < 3 ? (
                                        <Button type="button" onClick={handleNext}>
                                            Next
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting || !methods.formState.isValid}>
                                            {isSubmitting ? "Finishing..." : "Finish"}
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

    
