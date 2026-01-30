'use client';
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import BuyerAddressForm from "@/components/dashboard/BuyerAddressForm";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { getFriendlyErrorMessage } from '@/lib/friendlyError';
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { FormField } from "@/components/ui/form";
import { FormItem } from "@/components/ui/form";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form";
import { FormControl } from "@/components/ui/form";

const shippingAddressSchema = z.object({
    name: z.string().min(1, "Name required"),
    address1: z.string().min(1, "Address required"),
    city: z.string().min(1, "City required"),
    state: z.string().min(1, "State required"),
    zip: z.string().min(1, "ZIP required"),
    country: z.string().min(1, "Country required"),
});

const settingsSchema = z.object({
    paymentMethod: z.literal("STRIPE"),
    paymentIdentifier: z.string().optional(),
    notifyMessages: z.boolean(),
    notifyOrders: z.boolean(),
    notifyISO24: z.boolean(),
    notifySpotlight: z.boolean(),
    shippingAddress: shippingAddressSchema.optional(),
});

export default function SettingsPage() {
    const { profile, user, resendVerification } = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        values: {
            paymentMethod: 'STRIPE',
            paymentIdentifier: '',
            notifyMessages: profile?.notifyMessages ?? true,
            notifyOrders: profile?.notifyOrders ?? true,
            notifyISO24: profile?.notifyISO24 ?? true,
            notifySpotlight: profile?.notifySpotlight ?? true,
            shippingAddress: undefined,
        },
    });

    async function onSubmit(values: z.infer<typeof settingsSchema>) {
        if (!user || !firestore || profile?.status !== "ACTIVE") return;
        setIsSubmitting(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            // Deep sanitize: remove undefined at top level and inside shippingAddress
            const sanitizedValues = Object.fromEntries(
                Object.entries(values).filter(([k, v]) => v !== undefined || k !== 'shippingAddress')
            );
            if ('shippingAddress' in sanitizedValues && sanitizedValues.shippingAddress === undefined) {
                delete sanitizedValues.shippingAddress;
            } else if (sanitizedValues.shippingAddress) {
                const filtered = Object.fromEntries(
                    Object.entries(sanitizedValues.shippingAddress).filter(([_, v]) => v !== undefined)
                );
                if (typeof sanitizedValues.shippingAddress === 'object' && sanitizedValues.shippingAddress !== null) {
                    sanitizedValues.shippingAddress = {
                        ...sanitizedValues.shippingAddress,
                        ...filtered,
                    } as z.infer<typeof shippingAddressSchema>;
                }
            }
            await updateDoc(userRef, sanitizedValues);
            toast({
                title: "Settings Saved",
                description: "Your settings have been updated successfully.",
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: getFriendlyErrorMessage(error) || "Could not save your settings.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!profile) {
        return <AppLayout><div>Loading settings...</div></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold">Settings</h1>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <Card>
                            <CardHeader>
                                    <CardTitle>Payment Information</CardTitle>
                                    <CardDescription>All payments are processed securely through Stripe. You do not need to provide any other payment method.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>Payment Method</FormLabel>
                                                <Input value="Stripe" disabled readOnly />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                {/* Notifications removed */}
                                {/* Notification CardDescription removed */}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="notifyMessages" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">New Messages</FormLabel><FormMessage /></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="notifyOrders" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Order Updates</FormLabel><FormMessage /></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="notifyISO24" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">ISO24 Activity</FormLabel><FormMessage /></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                                <FormField control={form.control} name="notifySpotlight" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Store Spotlight</FormLabel><FormMessage /></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            </CardContent>
                        </Card>
                        <BuyerAddressForm />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save All Settings'}
                        </Button>
                    </form>
                </Form>
            </div>
        </AppLayout>
    );
}
