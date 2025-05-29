
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import type { Lead, Agent, Yacht, ModeOfPayment, LeadStatus, LeadType } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { format, formatISO, parseISO, isValid } from 'date-fns';

// Zod schema for lead form data
const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(leadStatusOptions),
  month: z.date({ required_error: "Lead/Event Date is required." }), 
  notes: z.string().optional(),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.enum(leadTypeOptions, { required_error: "Lead type is required."}),
  transactionId: z.string().optional(),
  modeOfPayment: z.enum(modeOfPaymentOptions),
  clientName: z.string().min(1, 'Client name is required'),

  // Standardized 9 Package Quantities
  qty_childRate: z.coerce.number().min(0).optional().default(0),
  qty_adultStandardRate: z.coerce.number().min(0).optional().default(0),
  qty_adultStandardDrinksRate: z.coerce.number().min(0).optional().default(0),
  qty_vipChildRate: z.coerce.number().min(0).optional().default(0),
  qty_vipAdultRate: z.coerce.number().min(0).optional().default(0),
  qty_vipAdultDrinksRate: z.coerce.number().min(0).optional().default(0),
  qty_royalChildRate: z.coerce.number().min(0).optional().default(0),
  qty_royalAdultRate: z.coerce.number().min(0).optional().default(0),
  qty_royalDrinksRate: z.coerce.number().min(0).optional().default(0),
  
  othersAmtCake: z.coerce.number().min(0).optional().default(0), 

  totalAmount: z.coerce.number().min(0).default(0),
  commissionPercentage: z.coerce.number().min(0).max(100).default(0),
  commissionAmount: z.coerce.number().optional().default(0),
  netAmount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  balanceAmount: z.coerce.number().min(0).default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  lastModifiedByUserId: z.string().optional(),
  ownerUserId: z.string().optional(),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSubmitSuccess: (data: Lead) => void;
}

// Configuration for the 9 standard package item quantities on a lead
// The 'label' will be simplified as per user request.
const allPackageItemConfigs: { qtyKey: keyof LeadFormData; rateKey: keyof Yacht; label: string; isGuestCount?: boolean }[] = [
  { qtyKey: 'qty_childRate', rateKey: 'childRate', label: 'Child Package', isGuestCount: true },
  { qtyKey: 'qty_adultStandardRate', rateKey: 'adultStandardRate', label: 'Adult Standard Package', isGuestCount: true },
  { qtyKey: 'qty_adultStandardDrinksRate', rateKey: 'adultStandardDrinksRate', label: 'Adult Standard Drinks Package', isGuestCount: true },
  { qtyKey: 'qty_vipChildRate', rateKey: 'vipChildRate', label: 'VIP Child Package', isGuestCount: true },
  { qtyKey: 'qty_vipAdultRate', rateKey: 'vipAdultRate', label: 'VIP Adult Package', isGuestCount: true },
  { qtyKey: 'qty_vipAdultDrinksRate', rateKey: 'vipAdultDrinksRate', label: 'VIP Adult Drinks Package', isGuestCount: true },
  { qtyKey: 'qty_royalChildRate', rateKey: 'royalChildRate', label: 'Royal Child Package', isGuestCount: true },
  { qtyKey: 'qty_royalAdultRate', rateKey: 'royalAdultRate', label: 'Royal Adult Package', isGuestCount: true },
  { qtyKey: 'qty_royalDrinksRate', rateKey: 'royalDrinksRate', label: 'Royal Drinks Package', isGuestCount: true },
];

// Configuration for the custom charge (from yacht.otherChargeName and yacht.otherChargeRate)
const customChargeConfig = {
  qtyKey: 'othersAmtCake' as keyof LeadFormData, 
  rateKey: 'otherChargeRate' as keyof Yacht,     
  nameKey: 'otherChargeName' as keyof Yacht      
};

const getDefaultFormValues = (): LeadFormData => ({
    agent: '', status: 'Upcoming', month: new Date(), yacht: '',
    type: 'Private', modeOfPayment: 'Online', clientName: '',
    notes: '', transactionId: '',
    qty_childRate: 0, qty_adultStandardRate: 0, qty_adultStandardDrinksRate: 0,
    qty_vipChildRate: 0, qty_vipAdultRate: 0, qty_vipAdultDrinksRate: 0,
    qty_royalChildRate: 0, qty_royalAdultRate: 0, qty_royalDrinksRate: 0,
    othersAmtCake: 0,
    totalAmount: 0, commissionPercentage: 0, commissionAmount:0, netAmount: 0,
    paidAmount: 0, balanceAmount: 0,
    lastModifiedByUserId: undefined,
    ownerUserId: undefined,
    createdAt: undefined,
    updatedAt: undefined,
});


export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [calculatedTotalGuests, setCalculatedTotalGuests] = useState(0);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: getDefaultFormValues(),
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (!isOpen) return;
      setIsLoadingDropdowns(true);
      try {
        const [agentsRes, yachtsRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/yachts'),
        ]);
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts');

        const agentsData = await agentsRes.json();
        const yachtsData = await yachtsRes.json();

        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setYachts(Array.isArray(yachtsData) ? yachtsData : []);

      } catch (error) {
        console.error("Error fetching dropdown data for Lead Form:", error);
        toast({ title: 'Error loading form data', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    fetchDropdownData();
  }, [isOpen]); 


  const watchedAgentId = form.watch('agent');
  const watchedYachtId = form.watch('yacht');
  const watchedStdQuantities = allPackageItemConfigs.map(config => form.watch(config.qtyKey as keyof LeadFormData));
  const watchedOthersAmtCakeQty = form.watch(customChargeConfig.qtyKey); 
  const watchedPaidAmount = form.watch('paidAmount');
  const watchedMonth = form.watch('month'); // Watch for event date changes

  useEffect(() => {
    const selectedAgent = agents.find(a => a.id === watchedAgentId);
    const agentDiscountRate = selectedAgent?.discount || 0;
    form.setValue('commissionPercentage', agentDiscountRate);

    const selectedYacht = yachts.find(y => y.id === watchedYachtId);

    let currentTotalAmount = 0;
    let currentTotalGuests = 0;

    if (selectedYacht) {
      allPackageItemConfigs.forEach(pkgConfig => {
        const quantity = form.getValues(pkgConfig.qtyKey as keyof LeadFormData) as number || 0;
        if (quantity > 0) {
          const rate = selectedYacht[pkgConfig.rateKey as keyof Yacht] as number || 0;
          currentTotalAmount += quantity * rate;
          if (pkgConfig.isGuestCount) {
            currentTotalGuests += quantity;
          }
        }
      });

      const customChargeQtyValue = form.getValues(customChargeConfig.qtyKey) as number || 0;
      const customChargeRateValue = selectedYacht[customChargeConfig.rateKey as keyof Yacht] as number || 0;
      if (customChargeQtyValue > 0 && customChargeRateValue > 0) {
        currentTotalAmount += customChargeQtyValue * customChargeRateValue;
      }
    }
    setCalculatedTotalGuests(currentTotalGuests);
    form.setValue('totalAmount', currentTotalAmount);

    const currentCommissionAmount = (currentTotalAmount * agentDiscountRate) / 100;
    form.setValue('commissionAmount', currentCommissionAmount);

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount);

    const paidAmtValue = form.getValues('paidAmount'); 
    const paidAmt = typeof paidAmtValue === 'number' ? paidAmtValue : 0;
    const currentBalanceAmount = currentNetAmount - paidAmt;
    form.setValue('balanceAmount', currentBalanceAmount);

  }, [
    watchedAgentId, watchedYachtId, ...watchedStdQuantities, 
    watchedOthersAmtCakeQty, watchedPaidAmount, form, agents, yachts
  ]);

  useEffect(() => {
    if (isOpen) {
      const defaultVals = getDefaultFormValues();
      if (lead) {
        const leadMonthDate = lead.month && isValid(parseISO(lead.month)) ? parseISO(lead.month) : defaultVals.month;
        form.reset({
          ...defaultVals,
          ...lead,
          month: leadMonthDate,
          transactionId: lead.transactionId || defaultVals.transactionId,
          notes: lead.notes || defaultVals.notes,
          qty_childRate: lead.qty_childRate || 0,
          qty_adultStandardRate: lead.qty_adultStandardRate || 0,
          qty_adultStandardDrinksRate: lead.qty_adultStandardDrinksRate || 0,
          qty_vipChildRate: lead.qty_vipChildRate || 0,
          qty_vipAdultRate: lead.qty_vipAdultRate || 0,
          qty_vipAdultDrinksRate: lead.qty_vipAdultDrinksRate || 0,
          qty_royalChildRate: lead.qty_royalChildRate || 0,
          qty_royalAdultRate: lead.qty_royalAdultRate || 0,
          qty_royalDrinksRate: lead.qty_royalDrinksRate || 0,
          othersAmtCake: lead.othersAmtCake || 0,
          totalAmount: lead.totalAmount || 0,
          commissionPercentage: lead.commissionPercentage || 0,
          commissionAmount: lead.commissionAmount || 0,
          netAmount: lead.netAmount || 0,
          paidAmount: lead.paidAmount || 0,
          balanceAmount: lead.balanceAmount || 0,
        } as LeadFormData);
      } else {
        form.reset(defaultVals);
      }
      const selectedAgent = agents.find(a => a.id === form.getValues('agent'));
      form.setValue('commissionPercentage', selectedAgent?.discount || 0);
    }
  }, [lead, form, isOpen, agents]);

  function onSubmit(data: LeadFormData) {
    const currentUserId = 'DO-user1'; // Placeholder

    const submittedLead: Lead = {
      ...data, 
      month: data.month ? formatISO(data.month) : formatISO(new Date()), 
      id: lead?.id, 
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId,
      ownerUserId: lead?.ownerUserId || currentUserId,
    };
    onSubmitSuccess(submittedLead);
  }

  if (isLoadingDropdowns && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
          <DialogHeader><DialogTitle>{lead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle></DialogHeader>
          <div className="p-6 text-center">Loading form data...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedYachtForRateDisplay = yachts.find(y => y.id === form.watch('yacht'));

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
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
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
                  <FormItem className="flex flex-col">
                    <FormLabel>Lead/Event Date</FormLabel>
                    <DatePicker
                        date={field.value instanceof Date ? field.value : (field.value && isValid(parseISO(field.value as unknown as string)) ? parseISO(field.value as unknown as string) : undefined)}
                        setDate={(date) => {
                            field.onChange(date);
                        }}
                        placeholder="Pick event date"
                    />
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
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
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
                     <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select lead type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {leadTypeOptions.map(typeOpt => (<SelectItem key={typeOpt} value={typeOpt}>{typeOpt}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="modeOfPayment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode of Payment</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select payment mode" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {modeOfPaymentOptions.map(mop => (<SelectItem key={mop} value={mop}>{mop}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., 202500001" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
                <h3 className="text-lg font-medium pt-4 border-t mt-6">Package Item Quantities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {allPackageItemConfigs.map(pkgFieldConfig => {
                    const rate = selectedYachtForRateDisplay ? selectedYachtForRateDisplay[pkgFieldConfig.rateKey as keyof Yacht] : undefined;
                    const rateDisplay = typeof rate === 'number' ? ` (Rate: ${rate} AED)` : selectedYachtForRateDisplay ? ' (Rate: N/A)' : ' (Select Yacht for Rate)';
                    return (
                      <FormField
                      key={pkgFieldConfig.qtyKey}
                      control={form.control}
                      name={pkgFieldConfig.qtyKey as keyof LeadFormData}
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{pkgFieldConfig.label}{/* Removed rate display here */}</FormLabel>
                          <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                    );
                  })}
                </div>
            </div>

            <h3 className="text-lg font-medium pt-4 border-t mt-6">Custom Charge</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name={customChargeConfig.qtyKey} 
                    render={({ field }) => {
                        const customChargeNameOnYacht = selectedYachtForRateDisplay?.[customChargeConfig.nameKey as keyof Yacht];
                        const customChargeRateOnYacht = selectedYachtForRateDisplay?.[customChargeConfig.rateKey as keyof Yacht];
                        const labelText = customChargeNameOnYacht 
                            ? `${customChargeNameOnYacht} Qty` 
                            : 'Quantity for Custom Charge';
                        const rateDisplay = typeof customChargeRateOnYacht === 'number' 
                            ? ` (Rate: ${customChargeRateOnYacht} AED)` 
                            : selectedYachtForRateDisplay ? ' (No Custom Charge Rate Set)' : ' (Select Yacht for Custom Charge)';
                        return (
                            <FormItem>
                                <FormLabel>{labelText}{rateDisplay}</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
            </div>
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / User Feed</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or updates about this lead..."
                      className="resize-y min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <h3 className="text-lg font-medium pt-4 border-t mt-6">Financials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormItem>
                  <FormLabel>Total Guests</FormLabel>
                  <Input type="number" value={calculatedTotalGuests} readOnly className="bg-muted/50" />
                  <FormDescription>Calculated from package quantities</FormDescription>
                </FormItem>
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} readOnly className="bg-muted/50" /></FormControl>
                       <FormDescription>Calculated from packages & custom charges</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Discount (%)</FormLabel>
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
                      <FormControl><Input type="number" min="0" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
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
                      <FormDescription>Net Amount - Paid</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <DialogFooter className="pt-6">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingDropdowns}>
                {isLoadingDropdowns ? 'Loading...' : (lead ? 'Save Changes' : 'Add Lead')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

