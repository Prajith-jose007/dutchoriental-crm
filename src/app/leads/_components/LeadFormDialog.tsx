
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Lead, User, Yacht } from '@/lib/types';
import { placeholderUsers, placeholderYachts } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

// Adjusted Zod schema based on Lead type, making specific package fields optional numbers
const leadFormSchema = z.object({
  id: z.string().optional(), // Optional for new leads
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost']),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.string().min(1, 'Lead type is required'),
  invoiceId: z.string().optional(),
  packageType: z.string().min(1, 'Package type is required'), // Could be enum if options are fixed
  clientName: z.string().min(1, 'Client name is required'),
  free: z.boolean().optional().default(false),
  dhowChild89: z.coerce.number().optional(),
  dhowFood99: z.coerce.number().optional(),
  dhowDrinks199: z.coerce.number().optional(),
  dhowVip299: z.coerce.number().optional(),
  oeChild129: z.coerce.number().optional(),
  oeFood149: z.coerce.number().optional(),
  oeDrinks249: z.coerce.number().optional(),
  oeVip349: z.coerce.number().optional(),
  sunsetChild179: z.coerce.number().optional(),
  sunsetFood199: z.coerce.number().optional(),
  sunsetDrinks299: z.coerce.number().optional(),
  lotusFood249: z.coerce.number().optional(),
  lotusDrinks349: z.coerce.number().optional(),
  lotusVip399: z.coerce.number().optional(),
  lotusVip499: z.coerce.number().optional(),
  othersAmtCake: z.coerce.number().optional(),
  quantity: z.coerce.number().min(0, 'Quantity must be a positive number'),
  rate: z.coerce.number().min(0, 'Rate must be a positive number'),
  totalAmount: z.coerce.number().min(0, 'Total Amount must be a positive number'),
  commissionPercentage: z.coerce.number().min(0).max(100, 'Commission must be between 0 and 100'),
  netAmount: z.coerce.number().min(0, 'Net Amount must be a positive number'),
  paidAmount: z.coerce.number().min(0, 'Paid Amount must be a positive number'),
  balanceAmount: z.coerce.number().min(0, 'Balance Amount must be a positive number'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null; // For editing
  onSubmitSuccess: (data: Lead) => void;
}

const packageFields: (keyof LeadFormData)[] = [
  'dhowChild89', 'dhowFood99', 'dhowDrinks199', 'dhowVip299',
  'oeChild129', 'oeFood149', 'oeDrinks249', 'oeVip349',
  'sunsetChild179', 'sunsetFood199', 'sunsetDrinks299',
  'lotusFood249', 'lotusDrinks349', 'lotusVip399', 'lotusVip499',
  'othersAmtCake'
];

const leadStatusOptions: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
const packageTypeOptions = ['DHOW', 'OE', 'SUNSET', 'LOTUS', 'OTHER']; // Added 'OTHER'

export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess }: LeadFormDialogProps) {
  const { toast } = useToast();
  const users: User[] = placeholderUsers; // In real app, fetch this
  const yachts: Yacht[] = placeholderYachts; // In real app, fetch this

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead || {
      agent: '',
      status: 'New',
      month: new Date().toISOString().slice(0,7), // Default to current month YYYY-MM
      yacht: '',
      type: '',
      packageType: '',
      clientName: '',
      free: false,
      quantity: 0,
      rate: 0,
      totalAmount: 0,
      commissionPercentage: 0,
      netAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      // Initialize optional package fields to undefined or 0 if you prefer
      dhowChild89: undefined, dhowFood99: undefined, dhowDrinks199: undefined, dhowVip299: undefined,
      oeChild129: undefined, oeFood149: undefined, oeDrinks249: undefined, oeVip349: undefined,
      sunsetChild179: undefined, sunsetFood199: undefined, sunsetDrinks299: undefined,
      lotusFood249: undefined, lotusDrinks349: undefined, lotusVip399: undefined, lotusVip499: undefined,
      othersAmtCake: undefined,
    },
  });

  useEffect(() => {
    if (lead) {
      form.reset(lead);
    } else {
      form.reset({
        agent: '', status: 'New', month: new Date().toISOString().slice(0,7), yacht: '',
        type: '', packageType: '', clientName: '', free: false, quantity: 0, rate: 0,
        totalAmount: 0, commissionPercentage: 0, netAmount: 0, paidAmount: 0, balanceAmount: 0,
        dhowChild89: undefined, dhowFood99: undefined, dhowDrinks199: undefined, dhowVip299: undefined,
        oeChild129: undefined, oeFood149: undefined, oeDrinks249: undefined, oeVip349: undefined,
        sunsetChild179: undefined, sunsetFood199: undefined, sunsetDrinks299: undefined,
        lotusFood249: undefined, lotusDrinks349: undefined, lotusVip399: undefined, lotusVip499: undefined,
        othersAmtCake: undefined,
      });
    }
  }, [lead, form, isOpen]);


  function onSubmit(data: LeadFormData) {
    const submittedLead: Lead = {
      ...data,
      id: lead?.id || `lead-${Date.now()}`, // Generate ID if new
      createdAt: lead?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Ensure numeric fields that might be undefined from form are numbers (or 0)
      dhowChild89: data.dhowChild89 || 0,
      dhowFood99: data.dhowFood99 || 0,
      // ... (repeat for all optional numeric package fields, ensuring they are numbers)
      oeChild129: data.oeChild129 || 0,
      lotusVip499: data.lotusVip499 || 0,
      othersAmtCake: data.othersAmtCake || 0,
    };
    onSubmitSuccess(submittedLead);
    toast({
      title: lead ? 'Lead Updated' : 'Lead Added',
      description: `Lead for ${data.clientName} has been ${lead ? 'updated' : 'added'}.`,
    });
    onOpenChange(false); // Close dialog
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Update the details for this lead.' : 'Fill in the details for the new lead.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an agent" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatusOptions.map(status => (
                           <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month (YYYY-MM)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2024-08" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="yacht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yacht</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a yacht" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {yachts.map((yacht) => (
                          <SelectItem key={yacht.id} value={yacht.id}> {/* Store yacht ID */}
                            {yacht.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Corporate Event" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packageTypeOptions.map(pkgType => (
                           <SelectItem key={pkgType} value={pkgType}>{pkgType}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., INV00123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="free"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Free</FormLabel>
                      <FormDescription>Is this lead/service free?</FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <h3 className="text-lg font-medium pt-4 border-t mt-6">Package Item Quantities</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packageFields.map(fieldName => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <h3 className="text-lg font-medium pt-4 border-t mt-6">Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Price in AED</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                       <FormDescription>Price in AED</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="netAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Amount (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Price in AED</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Price in AED</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="balanceAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance Amount (AED)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>Price in AED</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{lead ? 'Save Changes' : 'Add Lead'}</Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
