
'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { PCQuotation, PCYacht, PCLead } from '@/lib/pc-types';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';

const formSchema = z.object({
    id: z.string().optional(),
    leadId: z.string().min(1),
    yachtId: z.string().min(1),
    basePricePerHour: z.coerce.number().min(0),
    durationHours: z.coerce.number().min(0),
    subtotal: z.coerce.number().min(0).default(0),
    addons: z.object({
        captainCrew: z.enum(['Included', 'Extra']).default('Included'),
        fuelPolicy: z.enum(['Included', 'Limit', 'Extra']).default('Included'),
        foodBeverage: z.coerce.number().default(0),
        bbqSetup: z.coerce.number().default(0),
        liveDj: z.coerce.number().default(0),
        decorations: z.coerce.number().default(0),
        waterSports: z.coerce.number().default(0),
        alcoholPackage: z.coerce.number().default(0),
    }),
    discountAmount: z.coerce.number().default(0),
    vatAmount: z.coerce.number().default(0),
    totalAmount: z.coerce.number().default(0),
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']).default('Draft'),
    validUntil: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PCQuotationFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    quotation: PCQuotation | null;
    leads: PCLead[];
    yachts: PCYacht[];
    onSubmit: (values: FormValues) => void;
}

export function PCQuotationForm({ isOpen, onOpenChange, quotation, leads, yachts, onSubmit }: PCQuotationFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            status: 'Draft',
            basePricePerHour: 0,
            durationHours: 2,
            discountAmount: 0,
            addons: {
                captainCrew: 'Included',
                fuelPolicy: 'Included',
            }
        },
    });

    const watchedFields = useWatch({ control: form.control });
    const selectedYachtId = watchedFields.yachtId;
    const basePricePerHour = watchedFields.basePricePerHour;
    const durationHours = watchedFields.durationHours;
    const addons = watchedFields.addons;
    const discountAmount = watchedFields.discountAmount;

    useEffect(() => {
        if (selectedYachtId) {
            const yacht = yachts.find(y => y.id === selectedYachtId);
            if (yacht) {
                form.setValue('basePricePerHour', yacht.pricePerHour);
            }
        }
    }, [selectedYachtId, yachts]); // Removed 'form' from dependencies

    useEffect(() => {
        const base = Number(basePricePerHour || 0);
        const duration = Number(durationHours || 0);
        const addonsTotal =
            Number(addons?.foodBeverage || 0) +
            Number(addons?.bbqSetup || 0) +
            Number(addons?.liveDj || 0) +
            Number(addons?.decorations || 0) +
            Number(addons?.waterSports || 0) +
            Number(addons?.alcoholPackage || 0);

        const subtotal = (base * duration) + addonsTotal;
        const discount = Number(discountAmount || 0);
        const beforeVat = subtotal - discount;
        const vat = beforeVat * 0.05;
        const total = beforeVat + vat;

        // Only update if values have actually changed to prevent infinite loop
        if (form.getValues('subtotal') !== subtotal) {
            form.setValue('subtotal', subtotal, { shouldValidate: false });
        }
        if (form.getValues('vatAmount') !== vat) {
            form.setValue('vatAmount', vat, { shouldValidate: false });
        }
        if (form.getValues('totalAmount') !== total) {
            form.setValue('totalAmount', total, { shouldValidate: false });
        }
    }, [basePricePerHour, durationHours, addons, discountAmount]); // Watch only input fields

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Configure Quotation</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="leadId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client / Lead</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select lead" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {leads.map(l => <SelectItem key={l.id} value={l.id}>{l.firstName} {l.lastName}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="yachtId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Yacht</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select yacht" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {yachts.map(y => <SelectItem key={y.id} value={y.id}>{y.name} (${y.pricePerHour}/hr)</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                            <FormField
                                control={form.control}
                                name="basePricePerHour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Base Price ($/hr)</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="durationHours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hours</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel>Subtotal</FormLabel>
                                <Input disabled value={`$${form.getValues('subtotal')?.toFixed(2)}`} className="bg-white font-bold" />
                            </FormItem>
                        </div>

                        <div className="border rounded-xl p-6 space-y-4">
                            <h3 className="font-bold flex items-center gap-2 mb-4 text-slate-700">
                                Add-ons & Services
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="addons.captainCrew"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between p-2 border rounded-lg">
                                                <FormLabel className="m-0">Captain & Crew</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Included">Included</SelectItem>
                                                        <SelectItem value="Extra">Extra</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="addons.foodBeverage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Food & Beverage ($)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="addons.bbqSetup"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>BBQ Setup ($)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="addons.liveDj"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Live DJ ($)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="addons.waterSports"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Water Sports ($)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="addons.alcoholPackage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alcohol Package ($)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>${form.getValues('subtotal')?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Discount</span>
                                    <Input
                                        className="w-24 h-8 text-right font-bold"
                                        type="number"
                                        {...form.register('discountAmount')}
                                    />
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>VAT (5%)</span>
                                    <span>${watchedFields.vatAmount?.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-lg font-bold text-blue-600">${watchedFields.totalAmount?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-8">
                            <FormField
                                control={form.control}
                                name="validUntil"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Valid Until</FormLabel>
                                        <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormItem>
                                )}
                            />
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                                    {quotation ? 'Update Quote' : 'Create Quote'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
