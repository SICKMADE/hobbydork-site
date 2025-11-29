'use client';
import { useState } from 'react';
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { SpotlightSlot } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const slotSchema = z.object({
    storeId: z.string().min(1, 'Store ID is required.'),
    startAt: z.date({ required_error: 'Start date is required.'}),
    endAt: z.date({ required_error: 'End date is required.'}),
}).refine(data => data.endAt > data.startAt, {
    message: 'End date must be after start date.',
    path: ['endAt'],
});

export default function AdminSpotlightPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof slotSchema>>({
        resolver: zodResolver(slotSchema),
        defaultValues: { storeId: '' },
    });

    const slotsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'spotlightSlots');
    }, [firestore]);

    const { data: slots, isLoading } = useCollection<SpotlightSlot>(slotsQuery);

    const handleActiveChange = (slotId: string, currentStatus: boolean) => {
        if (!firestore) return;
        const slotRef = doc(firestore, 'spotlightSlots', slotId);
        const updatedData = { active: !currentStatus };
        updateDoc(slotRef, updatedData)
            .catch(err => {
                const contextualError = new FirestorePermissionError({
                    path: slotRef.path,
                    operation: 'update',
                    requestResourceData: updatedData,
                });
                errorEmitter.emit('permission-error', contextualError);
            });
    };

    async function onSubmit(values: z.infer<typeof slotSchema>) {
        if (!firestore) return;
        
        try {
            const newSlotRef = doc(collection(firestore, 'spotlightSlots'));
            const slotData = {
                slotId: newSlotRef.id,
                storeId: values.storeId,
                ownerUid: 'ADMIN_SET', // This could be fetched if needed
                startAt: values.startAt,
                endAt: values.endAt,
                active: true,
                createdAt: serverTimestamp(),
            };
            
            await setDoc(newSlotRef, slotData);

            toast({ title: 'Spotlight Slot Created', description: 'The new slot has been added.' });
            form.reset();
        } catch (err: any) {
            const contextualError = new FirestorePermissionError({
                path: 'spotlightSlots',
                operation: 'create',
                requestResourceData: values,
            });
            errorEmitter.emit('permission-error', contextualError);
        }
    }

    return (
        <AppLayout>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Spotlight Slot</CardTitle>
                            <CardDescription>Add a new store to the homepage spotlight.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="storeId" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Store ID</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="startAt" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <DatePicker date={field.value} setDate={field.onChange} />
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="endAt" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date</FormLabel>
                                            <DatePicker date={field.value} setDate={field.onChange} />
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="w-full">Create Slot</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Spotlight Slots</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Store ID</TableHead>
                                        <TableHead>Starts</TableHead>
                                        <TableHead>Ends</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Active</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading && <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>}
                                    {slots?.map(slot => {
                                        const now = new Date();
                                        const isActiveNow = slot.startAt.toDate() <= now && slot.endAt.toDate() >= now && slot.active;
                                        return (
                                            <TableRow key={slot.slotId}>
                                                <TableCell className="font-mono text-xs">{slot.storeId}</TableCell>
                                                <TableCell>{format(slot.startAt.toDate(), 'PPp')}</TableCell>
                                                <TableCell>{format(slot.endAt.toDate(), 'PPp')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={isActiveNow ? 'default' : 'outline'}>
                                                        {isActiveNow ? 'Live' : (slot.endAt.toDate() < now ? 'Expired' : 'Scheduled')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Switch
                                                        checked={slot.active}
                                                        onCheckedChange={() => handleActiveChange(slot.slotId, slot.active)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
