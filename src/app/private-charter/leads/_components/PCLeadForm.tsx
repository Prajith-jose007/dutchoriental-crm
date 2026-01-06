
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
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
import { Textarea } from '@/components/ui/textarea';
import { PCLead, PCLeadStatus, PCLeadPriority } from '@/lib/pc-types';
import { useEffect } from 'react';
import { DatePicker } from '@/components/ui/date-picker';

const formSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().min(1, 'Phone is required'),
    email: z.string().email().optional().or(z.literal('')),
    nationality: z.string().optional(),
    language: z.string().optional(),
    source: z.string().optional(),
    inquiryDate: z.date().optional(),
    yachtType: z.string().optional(),
    adultsCount: z.coerce.number().min(0).default(0),
    kidsCount: z.coerce.number().min(0).default(0),
    durationHours: z.coerce.number().min(0).default(1),
    preferredDate: z.date().optional(),
    budgetRange: z.string().optional(),
    occasion: z.string().optional(),
    assignedAgentId: z.string().optional(),
    status: z.enum(['New', 'Contacted', 'Follow-up', 'Quoted', 'Negotiation', 'Confirmed', 'Lost']),
    priority: z.enum(['Low', 'Medium', 'High']),
    nextFollowUpDate: z.date().optional().nullable(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PCLeadFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: PCLead | null;
    onSubmit: (values: FormValues) => void;
}

export function PCLeadForm({ isOpen, onOpenChange, lead, onSubmit }: PCLeadFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            status: 'New',
            priority: 'Medium',
            adultsCount: 0,
            kidsCount: 0,
            durationHours: 2,
        },
    });

    useEffect(() => {
        if (lead) {
            form.reset({
                ...lead,
                inquiryDate: lead.inquiryDate ? new Date(lead.inquiryDate) : undefined,
                preferredDate: lead.preferredDate ? new Date(lead.preferredDate) : undefined,
                nextFollowUpDate: lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate) : undefined,
            } as any);
        } else if (isOpen) {
            // Only reset when dialog is opened, not on every render
            form.reset({
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
                status: 'New',
                priority: 'Medium',
                adultsCount: 0,
                kidsCount: 0,
                durationHours: 2,
                inquiryDate: new Date(),
            });
        }
    }, [lead, isOpen]); // Removed 'form' from dependencies

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {lead ? 'Edit Private Charter Lead' : 'New Private Charter Lead'}
                    </DialogTitle>
                    <DialogDescription>
                        Enter the details for the premium charter inquiry.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl><Input placeholder="John" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone (WhatsApp)</FormLabel>
                                        <FormControl><Input placeholder="+971..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input placeholder="john@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="nationality"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nationality</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="language"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Language</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['Website', 'WhatsApp', 'Instagram', 'Walk-in', 'Partner', 'Agent'].map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Inquiry Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="yachtType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preferred Yacht Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {['Luxury', 'Mega Yacht', 'Catamaran', 'Speedboat'].map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="durationHours"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration (Hours)</FormLabel>
                                            <FormControl><Input type="number" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="adultsCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adults</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="kidsCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kids</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="preferredDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Preferred Date & Time</FormLabel>
                                        <DatePicker date={field.value} setDate={field.onChange} />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="occasion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Occasion</FormLabel>
                                        <FormControl><Input placeholder="e.g. Birthday" {...field} /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Sales Management</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {['New', 'Contacted', 'Follow-up', 'Quoted', 'Negotiation', 'Confirmed', 'Lost'].map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {['Low', 'Medium', 'High'].map(p => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nextFollowUpDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Next Follow-up</FormLabel>
                                            <DatePicker date={field.value || undefined} setDate={field.onChange} />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes / History</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Conversation details..." {...field} className="h-24" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="mt-8 border-t pt-6">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                                {lead ? 'Update Lead' : 'Create Lead'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
