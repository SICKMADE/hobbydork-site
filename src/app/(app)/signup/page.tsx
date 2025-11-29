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

const step1Schema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
    storeName: z.string().min(3, "Store name must be at least 3 characters long."),
    slug: z.string().min(3, "URL slug must be at least 3 characters long.")
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens."),
    about: z.string().min(10, "About section must be at least 10 characters long."),
    paymentMethod: z.enum(["PAYPAL", "VENMO"], { required_error: "Please select a payment method." }),
    paymentIdentifier: z.string().min(3, "Please enter your payment username or email."),
    agreeGoodsAndServices: z.literal(true, { errorMap: () => ({ message: "You must agree to use Goods & Services." })}),
    agreeTerms: z.literal(true, { errorMap: () => ({ message: "You must agree to the Terms." })}),
    agreeAge: z.literal(true, { errorMap: () => ({ message: "You must confirm you are 18 or older." })}),
    agreeOneAccount: z.literal(true, { errorMap: () => ({ message: "You must acknowledge the one account rule." })}),
});

const combinedSchema = step1Schema.merge(step2Schema);

type SignupFormValues = z.infer<typeof combinedSchema>;

const Step1 = () => {
    const { control } = useFormContext<SignupFormValues>();
    return (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
            <FormField
                control={control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
                <FormField
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </motion.div>
    );
};


const Step2 = () => {
    const { control, watch, setValue } = useFormContext<SignupFormValues>();
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
}

export default function SignupPage() {
    const { signup } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const methods = useForm<SignupFormValues>({
        resolver: zodResolver(step === 1 ? step1Schema : combinedSchema),
        mode: "onChange",
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            storeName: "",
            slug: "",
            about: "",
            paymentMethod: undefined,
            paymentIdentifier: "",
            agreeGoodsAndServices: undefined,
            agreeTerms: undefined,
            agreeAge: undefined,
            agreeOneAccount: undefined,
        },
    });

    const handleNext = async () => {
        const isValid = await methods.trigger(["email", "password", "confirmPassword"]);
        if (isValid) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    async function onSubmit(values: SignupFormValues) {
        setIsSubmitting(true);
        const success = await signup(values);
        if (success) {
            router.push('/');
            router.refresh();
        } else {
            setIsSubmitting(false);
        }
    }

    const stepTitles = ["Create Your Account", "Set Up Your Store"];
    const stepDescriptions = ["Start by setting up your login credentials.", "Now, let's get your store and payment details sorted."];

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-2xl">
                <div className="mb-8 flex justify-center">
                    <Logo />
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{stepTitles[step - 1]}</CardTitle>
                        <CardDescription>
                            Welcome to VaultVerse! {stepDescriptions[step - 1]} (Step {step} of 2)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <FormProvider {...methods}>
                            <form onSubmit={methods.handleSubmit(onSubmit)}>
                                <AnimatePresence mode="wait">
                                    {step === 1 ? <Step1 key="step1" /> : <Step2 key="step2" />}
                                </AnimatePresence>
                                <div className="flex justify-between mt-8">
                                    {step === 2 ? (
                                        <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                            Back
                                        </Button>
                                    ) : (
                                       <Button asChild variant="link">
                                            <Link href="/">Back to Login</Link>
                                       </Button>
                                    )}
                                    
                                    {step === 1 ? (
                                        <Button type="button" onClick={handleNext}>
                                            Next
                                        </Button>
                                    ) : (
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? "Creating Account..." : "Create Account"}
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
