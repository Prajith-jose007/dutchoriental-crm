
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
// import { Checkbox } from '@/components/ui/checkbox'; // Removed Checkbox import
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Lead, Agent, Yacht } from '@/lib/types';
import { placeholderAgents, placeholderYachts } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useMemo } from 'react';

const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost']),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.string().min(1, 'Lead type is required'),
  invoiceId: z.string().optional(),
  packageType: z.enum(['DHOW', 'OE', 'SUNSET', 'LOTUS', 'OTHER', '']),
  clientName: z.string().min(1, 'Client name is required'),
  // free: z.boolean().optional().default(false), // Removed free
  dhowChild89: z.coerce.number().optional().default(0),
  dhowFood99: z.coerce.number().optional().default(0),
  dhowDrinks199: z.coerce.number().optional().default(0),
  dhowVip299: z.coerce.number().optional().default(0),
  oeChild129: z.coerce.number().optional().default(0),
  oeFood149: z.coerce.number().optional().default(0),
  oeDrinks249: z.coerce.number().optional().default(0),
  oeVip349: z.coerce.number().optional().default(0),
  sunsetChild179: z.coerce.number().optional().default(0),
  sunsetFood199: z.coerce.number().optional().default(0),
  sunsetDrinks299: z.coerce.number().optional().default(0),
  lotusFood249: z.coerce.number().optional().default(0),
  lotusDrinks349: z.coerce.number().optional().default(0),
  lotusVip399: z.coerce.number().optional().default(0),
  lotusVip499: z.coerce.number().optional().default(0),
  othersAmtCake: z.coerce.number().optional().default(0),
  quantity: z.coerce.number().min(0).optional().default(0),
  rate: z.coerce.number().min(0).optional().default(0),
  totalAmount: z.coerce.number().min(0).default(0),
  commissionPercentage: z.coerce.number().min(0).max(100).default(0),
  commissionAmount: z.coerce.number().optional().default(0),
  netAmount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  balanceAmount: z.coerce.number().min(0).default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSubmitSuccess: (data: Lead) => void;
}

interface PackageFieldConfig {
  name: keyof LeadFormData;
  label: string;
  packageTypes: Array<Lead['packageType']>;
  rateKeySuffix: string;
}

const allPackageItemFields: PackageFieldConfig[] = [
  { name: 'dhowChild89', label: 'Dhow Child Qty', packageTypes: ['DHOW'], rateKeySuffix: '_rate' },
  { name: 'dhowFood99', label: 'Dhow Food Qty', packageTypes: ['DHOW'], rateKeySuffix: '_rate' },
  { name: 'dhowDrinks199', label: 'Dhow Drinks Qty', packageTypes: ['DHOW'], rateKeySuffix: '_rate' },
  { name: 'dhowVip299', label: 'Dhow VIP Qty', packageTypes: ['DHOW'], rateKeySuffix: '_rate' },
  { name: 'oeChild129', label: 'OE Child Qty', packageTypes: ['OE'], rateKeySuffix: '_rate' },
  { name: 'oeFood149', label: 'OE Food Qty', packageTypes: ['OE'], rateKeySuffix: '_rate' },
  { name: 'oeDrinks249', label: 'OE Drinks Qty', packageTypes: ['OE'], rateKeySuffix: '_rate' },
  { name: 'oeVip349', label: 'OE VIP Qty', packageTypes: ['OE'], rateKeySuffix: '_rate' },
  { name: 'sunsetChild179', label: 'Sunset Child Qty', packageTypes: ['SUNSET'], rateKeySuffix: '_rate' },
  { name: 'sunsetFood199', label: 'Sunset Food Qty', packageTypes: ['SUNSET'], rateKeySuffix: '_rate' },
  { name: 'sunsetDrinks299', label: 'Sunset Drinks Qty', packageTypes: ['SUNSET'], rateKeySuffix: '_rate' },
  { name: 'lotusFood249', label: 'Lotus Food Qty', packageTypes: ['LOTUS'], rateKeySuffix: '_rate' },
  { name: 'lotusDrinks349', label: 'Lotus Drinks Qty', packageTypes: ['LOTUS'], rateKeySuffix: '_rate' },
  { name: 'lotusVip399', label: 'Lotus VIP Qty', packageTypes: ['LOTUS'], rateKeySuffix: '_rate' },
  { name: 'lotusVip499', label: 'Lotus VIP Qty', packageTypes: ['LOTUS'], rateKeySuffix: '_rate' },
];

const leadStatusOptions: Lead['status'][] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
const packageTypeOptions: Lead['packageType'][] = ['DHOW', 'OE', 'SUNSET', 'LOTUS', 'OTHER', ''];

export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess }: LeadFormDialogProps) {
  const { toast } = useToast();
  const agents: Agent[] = placeholderAgents;
  const yachts: Yacht[] = placeholderYachts;

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: lead || {
      agent: '', status: 'New', month: new Date().toISOString().slice(0,7), yacht: '',
      type: '', packageType: '', clientName: '', // free: false, // Removed free
      ...allPackageItemFields.reduce((acc, field) => ({ ...acc, [field.name]: 0 }), {}),
      othersAmtCake: 0,
      quantity: 0, rate: 0, totalAmount: 0, commissionPercentage: 0, commissionAmount:0, netAmount: 0,
      paidAmount: 0, balanceAmount: 0,
    },
  });

  const watchedPackageType = form.watch('packageType');
  const watchedAgentId = form.watch('agent');
  const watchedYachtId = form.watch('yacht');
  const watchedPackageQuantities = allPackageItemFields.map(field => form.watch(field.name));
  const watchedOthersAmtCake = form.watch('othersAmtCake');
  const watchedPaidAmount = form.watch('paidAmount');
  // const watchedFree = form.watch('free'); // Removed free

  const visiblePackageFields = useMemo(() => {
    if (!watchedPackageType || watchedPackageType === 'OTHER' || watchedPackageType === '') {
      return [];
    }
    return allPackageItemFields.filter(field => field.packageTypes.includes(watchedPackageType));
  }, [watchedPackageType]);

  useEffect(() => {
    // if (watchedFree) { // Removed free logic block
    //   form.setValue('totalAmount', 0);
    //   form.setValue('commissionAmount', 0);
    //   form.setValue('netAmount', 0);
    //   form.setValue('paidAmount', 0);
    //   form.setValue('balanceAmount', 0);
    //   form.setValue('commissionPercentage', 0);
    //   return;
    // }

    const selectedAgent = agents.find(a => a.id === watchedAgentId);
    const agentDiscountRate = selectedAgent?.discountRate ?? 0;
    form.setValue('commissionPercentage', agentDiscountRate);

    const selectedYacht = yachts.find(y => y.id === watchedYachtId);
    if (!selectedYacht) {
        form.setValue('totalAmount', 0);
        form.setValue('commissionAmount', 0);
        form.setValue('netAmount', 0);
        form.setValue('balanceAmount', form.getValues('totalAmount') - form.getValues('paidAmount'));
        return;
    }

    let currentTotalAmount = 0;
    allPackageItemFields.forEach(pkgField => {
      const quantity = form.getValues(pkgField.name) as number || 0;
      if (quantity > 0) {
        const rateKey = (pkgField.name + pkgField.rateKeySuffix) as keyof Yacht;
        const rate = selectedYacht[rateKey] as number || 0;
        currentTotalAmount += quantity * rate;
      }
    });

     if (watchedPackageType === 'OTHER') {
        currentTotalAmount += form.getValues('othersAmtCake') || 0;
     } else {
        const othersAmt = form.getValues('othersAmtCake');
        if (typeof othersAmt === 'number' && othersAmt > 0 && !allPackageItemFields.find(pf => pf.name === 'othersAmtCake' && pf.packageTypes.includes(watchedPackageType))) {
            currentTotalAmount += othersAmt;
        }
     }

    form.setValue('totalAmount', currentTotalAmount);

    const currentCommissionAmount = (currentTotalAmount * agentDiscountRate) / 100;
    form.setValue('commissionAmount', currentCommissionAmount);

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount);

    const currentBalanceAmount = currentTotalAmount - (form.getValues('paidAmount') || 0);
    form.setValue('balanceAmount', currentBalanceAmount);

  }, [
    watchedAgentId, watchedYachtId, watchedPackageType, ...watchedPackageQuantities,
    watchedOthersAmtCake, watchedPaidAmount, /*watchedFree,*/ form, agents, yachts // Removed watchedFree
  ]);

  useEffect(() => {
    if (isOpen) {
        const defaultVals = lead || {
            agent: '', status: 'New', month: new Date().toISOString().slice(0,7), yacht: '',
            type: '', packageType: '', clientName: '', // free: false, // Removed free
             ...allPackageItemFields.reduce((acc, field) => ({ ...acc, [field.name]: 0 }), {}),
            othersAmtCake: 0,
            quantity: 0, rate: 0, totalAmount: 0, commissionPercentage: 0, commissionAmount: 0, netAmount: 0,
            paidAmount: 0, balanceAmount: 0,
        };
      form.reset(defaultVals as LeadFormData);
    }
  }, [lead, form, isOpen]);

  function onSubmit(data: LeadFormData) {
    const submittedLead: Lead = {
      ...data,
      id: lead?.id || `lead-${Date.now()}`,
      createdAt: lead?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dhowChild89: data.dhowChild89 || 0,
      dhowFood99: data.dhowFood99 || 0,
      dhowDrinks199: data.dhowDrinks199 || 0,
      dhowVip299: data.dhowVip299 || 0,
      oeChild129: data.oeChild129 || 0,
      oeFood149: data.oeFood149 || 0,
      oeDrinks249: data.oeDrinks249 || 0,
      oeVip349: data.oeVip349 || 0,
      sunsetChild179: data.sunsetChild179 || 0,
      sunsetFood199: data.sunsetFood199 || 0,
      sunsetDrinks299: data.sunsetDrinks299 || 0,
      lotusFood249: data.lotusFood249 || 0,
      lotusDrinks349: data.lotusDrinks349 || 0,
      lotusVip399: data.lotusVip399 || 0,
      lotusVip499: data.lotusVip499 || 0,
      othersAmtCake: data.othersAmtCake || 0,
      commissionPercentage: data.commissionPercentage || 0,
      commissionAmount: data.commissionAmount || 0,
      // free: data.free, // Removed free
    };
    onSubmitSuccess(submittedLead);
    toast({
      title: lead ? 'Lead Updated' : 'Lead Added',
      description: `Lead for ${data.clientName} has been ${lead ? 'updated' : 'added'}.`,
    });
    onOpenChange(false);
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
                    <FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {agents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {leadStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
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
                    <FormControl><Input placeholder="e.g., 2024-08" {...field} /></FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a yacht" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {yachts.map((yacht) => (<SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>))}
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
                    <FormControl><Input placeholder="e.g., Corporate Event" {...field} /></FormControl>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select package type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {packageTypeOptions.filter(pt => pt !== '').map(pkgType => (<SelectItem key={pkgType} value={pkgType}>{pkgType}</SelectItem>))}
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
                    <FormControl><Input placeholder="e.g., INV00123" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Removed Free Booking FormField */}
            </div>

            {visiblePackageFields.length > 0 && (
                <>
                    <h3 className="text-lg font-medium pt-4 border-t mt-6">Package Item Quantities for {form.getValues('packageType')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visiblePackageFields.map(pkgFieldConfig => (
                        <FormField
                        key={pkgFieldConfig.name}
                        control={form.control}
                        name={pkgFieldConfig.name}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{pkgFieldConfig.label}</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    ))}
                    </div>
                </>
            )}
            {watchedPackageType === 'OTHER' && (
                 <>
                    <h3 className="text-lg font-medium pt-4 border-t mt-6">Other Package Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="othersAmtCake"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Others Amount (e.g., Cake) (AED)</FormLabel>
                                <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                </>
            )}

            <h3 className="text-lg font-medium pt-4 border-t mt-6">Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                       <FormDescription>Calculated from packages</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Discount Rate (%)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>From selected agent</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="commissionAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>Calculated value</FormDescription>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>Total - Commission</FormDescription>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                      <FormDescription>Amount paid by client</FormDescription>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                      <FormDescription>Total - Paid</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <DialogFooter className="pt-6">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {lead ? 'Save Changes' : 'Add Lead'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
