
'use client';

import React, { useState, useEffect } from 'react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';
import AppLayout from '@/components/layout/AppLayout';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const storeSchema = z.object({
    about: z.string().min(10, "About section must be at least 10 characters long."),
});

const paymentSchema = z.object({
    paymentMethod: z.enum(["PAYPAL", "VENMO"], { required_error: "Please select a payment method." }),
    paymentIdentifier: z.string().min(3, "Please enter your payment username or email."),
    goodsAndServicesAgreed: z.literal(true, { errorMap: () => ({ message: "You must agree to the Goods & Services policy."})})
});

const sellerSchema = storeSchema.merge(paymentSchema);

type SellerFormValues = z.infer<typeof sellerSchema>;

const Step1Store = () => {
    const { control } = useFormContext<SellerFormValues>();
    const { profile } = useAuth();
    
    if (!profile) return null;

    const slug = profile.displayName?.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') || '';

    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
            <div className="space-y-2">
                <Label>Store Name</Label>
                <Input value={profile.displayName || ''} disabled readOnly />
                <FormDescription>Your store name is permanently linked to your display name.</FormDescription>
            </div>
            <div className="space-y-2">
                <Label>Store URL</Label>
                 <div className="flex items-center">
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 h-10 flex items-center">
                        vaultverse.app/store/
                    </span>
                    <Input value={slug} disabled readOnly className="rounded-l-none" />
                </div>
                 <FormDescription>Your store's unique URL is generated from your display name and cannot be changed.</FormDescription>
            </div>
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
    const { control } = useFormContext<SellerFormValues>();
    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-8">
             <FormField
                control={control}
                name="paymentMethod"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Preferred Payment Method</FormLabel>
                     <FormDescription>Required to receive payments from buyers.</FormDescription>
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
                            <Input placeholder="Your payment username" {...field} />
                        </FormControl>
                         <FormDescription>
                            This will be shown to buyers at checkout. Make sure it's correct!
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={control}
                name="goodsAndServicesAgreed"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                        <FormLabel>I agree that all payments for sales on this platform will be sent using Goods & Services (no Friends & Family or off-platform payments). This is required to reduce scams and protect both buyer and seller.</FormLabel>
                        <FormMessage />
                    </div>
                    </FormItem>
                )}
            />
        </motion.div>
    );
};


export default function CreateStorePage() {
    const { user, profile } = useAuth();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<SellerFormValues>({
        resolver: zodResolver(
            step === 1 ? storeSchema : sellerSchema
        ),
        mode: "onChange",
        defaultValues: {
            about: "",
            paymentMethod: profile?.paymentMethod || "PAYPAL",
            paymentIdentifier: profile?.paymentIdentifier || "",
            goodsAndServicesAgreed: profile?.goodsAndServicesAgreed || false,
        }
    });

    useEffect(() => {
        if (profile?.paymentMethod) {
            methods.setValue('paymentMethod', profile.paymentMethod);
        }
         if (profile?.paymentIdentifier) {
            methods.setValue('paymentIdentifier', profile.paymentIdentifier);
        }
        if (profile?.goodsAndServicesAgreed) {
            methods.setValue('goodsAndServicesAgreed', profile.goodsAndServicesAgreed);
        }
    }, [profile, methods]);

    const handleNext = async () => {
        const fieldsToValidate: (keyof SellerFormValues)[] = ['about'];
        const isValid = await methods.trigger(fieldsToValidate);
        if (isValid) {
            setStep(s => s + 1);
        }
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    async function onSubmit(values: SellerFormValues) {
        if (!user || !firestore || !profile?.displayName) {
            toast({ variant: 'destructive', title: 'Error', description: 'You are not properly signed in or missing a display name.' });
            return;
        }

        const storeName = profile.displayName;
        const slug = storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        setIsSubmitting(true);
        try {
            await runTransaction(firestore, async (transaction) => {
                const newStoreRef = doc(collection(firestore, "storefronts"));
                const userProfileRef = doc(firestore, "users", user.uid);
                
                transaction.update(userProfileRef, {
                    isSeller: true,
                    storeId: newStoreRef.id,
                    paymentMethod: values.paymentMethod,
                    paymentIdentifier: values.paymentIdentifier,
                    goodsAndServicesAgreed: values.goodsAndServicesAgreed,
                    updatedAt: serverTimestamp(),
                });

                transaction.set(newStoreRef, {
                    id: newStoreRef.id,
                    storeId: newStoreRef.id,
                    ownerUid: user.uid,
                    storeName: storeName,
                    slug: slug,
                    about: values.about,
                    avatarUrl: placeholderImages['store-logo-1']?.imageUrl || `https://picsum.photos/seed/${slug}/128/128`,
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
                title: 'Your Store is Live!',
                description: 'Congratulations! You can now start listing items for sale.',
            });
            
            router.push('/listings');
            router.refresh();

        } catch (error: any) {
             console.error("Seller onboarding failed:", error);
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
        { title: "Set Up Your Store", description: "This will be your public identity on VaultVerse." },
        { title: "Set Up Payments", description: "Choose how you want to get paid by buyers." },
    ];

    return (
        <AppLayout>
            <div className="w-full max-w-2xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{stepDetails[step - 1].title}</CardTitle>
                        <CardDescription>
                            Step {step} of 2: {stepDetails[step - 1].description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FormProvider {...methods}>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                <AnimatePresence mode="wait">
                                    {step === 1 && <Step1Store key="step1" />}
                                    {step === 2 && <Step2Payment key="step2" />}
                                </AnimatePresence>
                                <div className="flex justify-between mt-8">
                                    {step > 1 ? (
                                        <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                            Back
                                        </Button>
                                    ) : <div />}
                                    
                                    {step < 2 ? (
                                        <Button type="button" onClick={handleNext}>
                                            Next
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting || !methods.formState.isValid}>
                                            {isSubmitting ? "Finishing..." : "Create My Store"}
                                        </Button>
                                    )}
                                </div>
                            </form>
                       </FormProvider>
                    </CardContent>
                 </Card>
            </div>
        </AppLayout>
    );
}
