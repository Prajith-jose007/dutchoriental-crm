
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SalesLead } from '@/lib/types';

const formSchema = z.object({
    clientName: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(5, 'Phone is required'),
    subject: z.string().min(2, 'Subject is required'),
    message: z.string().optional(),
    source: z.string().default('Website'),
    status: z.enum(['New', 'Contacted', 'Qualified', 'Converted', 'Lost']).default('New'),
    priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
    preferredDate: z.string().optional(),
    paxCount: z.number().min(0).default(0),
    assignedTo: z.string().optional(),
    notes: z.string().optional(),
});

interface SalesLeadFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lead: SalesLead | null;
    onSubmit: (values: any) => void;
}

export function SalesLeadForm({ isOpen, onOpenChange, lead, onSubmit }: SalesLeadFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            clientName: '',
            email: '',
            phone: '',
            subject: '',
            message: '',
            source: 'Website',
            status: 'New',
            priority: 'Medium',
            preferredDate: '',
            paxCount: 0,
            assignedTo: '',
            notes: '',
        },
    });

    useEffect(() => {
        if (lead) {
            form.reset({
                ...lead,
                preferredDate: lead.preferredDate ? lead.preferredDate.split('T')[0] : '',
                paxCount: Number(lead.paxCount) || 0,
            });
        } else {
            form.reset({
                clientName: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                source: 'Website',
                status: 'New',
                priority: 'Medium',
                preferredDate: '',
                paxCount: 0,
                assignedTo: '',
                notes: '',
            });
        }
    }, [lead, form]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{lead ? 'Edit Sales Lead' : 'Add New Sales Lead'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(val => onSubmit({ ...val, id: lead?.id }))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="clientName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Full Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="subject"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Interest / Subject</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Dinner Cruise" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="email@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+971..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="preferredDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Event Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="paxCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Guests (Pax)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                                        </FormControl>
                                        <FormMessage />
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
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Website">Website</SelectItem>
                                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                                <SelectItem value="Instagram">Instagram</SelectItem>
                                                <SelectItem value="Phone">Phone</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="New">New</SelectItem>
                                                <SelectItem value="Contacted">Contacted</SelectItem>
                                                <SelectItem value="Qualified">Qualified</SelectItem>
                                                <SelectItem value="Converted">Converted</SelectItem>
                                                <SelectItem value="Lost">Lost</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
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
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Original Message</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Message from website..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Internal Notes</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Follow up notes..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                {lead ? 'Update Lead' : 'Create Lead'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
