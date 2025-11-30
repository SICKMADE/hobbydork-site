
'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const agreementsSchema = z.object({
    agreeGoodsAndServices: z.literal(true, { errorMap: () => ({ message: "You must agree to use Goods & Services." })}),
    agreeTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms." })}),
    agreeAge: z.literal(true, { errorMap: () => ({ message: "You must confirm you are 18 or older." })}),
    agreeOneAccount: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the one account rule." })}),
});

type OnboardingFormValues = z.infer<typeof agreementsSchema>;

const StepAgreements = () => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<OnboardingFormValues>({
        resolver: zodResolver(agreementsSchema),
        mode: "onChange",
        defaultValues: {
            agreeGoodsAndServices: profile?.goodsAndServicesAgreed || false,
            agreeTerms: false,
            agreeAge: false,
            agreeOneAccount: profile?.oneAccountAcknowledged || false,
        }
    });

    async function onSubmit(values: OnboardingFormValues) {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You are not properly signed in.' });
            return;
        }

        setIsSubmitting(true);
        const userProfileRef = doc(firestore, "users", user.uid);
        const updateData = {
            oneAccountAcknowledged: values.agreeOneAccount,
            goodsAndServicesAgreed: values.agreeGoodsAndServices,
            updatedAt: serverTimestamp(),
        };

        try {
            await updateDoc(userProfileRef, updateData);

            toast({
                title: 'Welcome to VaultVerse!',
                description: 'Your account is set up. Happy collecting!',
            });
            
            router.push('/');
            router.refresh();

        } catch (error: any) {
             const contextualError = new FirestorePermissionError({
                path: userProfileRef.path,
                operation: 'update', 
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-8 flex justify-center">
                    <Logo />
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Welcome, {profile?.displayName || 'Collector'}!</CardTitle>
                        <CardDescription>
                            Just a few things to agree to before you get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FormProvider {...methods}>
                            <Form {...methods}>
                                <form onSubmit={methods.handleSubmit(onSubmit)}>
                                    <StepAgreements />
                                    <div className="flex justify-end mt-8">
                                        <Button type="submit" disabled={isSubmitting || !methods.formState.isValid}>
                                            {isSubmitting ? "Saving..." : "Finish Setup"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                       </FormProvider>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
