
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

  // Standardized 9 Package Quantities from Yacht
  qty_childRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_adultStandardRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_adultStandardDrinksRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_vipChildRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_vipAdultRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_vipAdultDrinksRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_royalChildRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_royalAdultRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),
  qty_royalDrinksRate: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0),

  othersAmtCake: z.coerce.number().min(0, "Quantity must be non-negative").optional().default(0), // Quantity for custom charge

  totalAmount: z.coerce.number().default(0),
  commissionPercentage: z.coerce.number().min(0, "Commission must be non-negative").max(100, "Commission cannot exceed 100%").default(0),
  commissionAmount: z.coerce.number().optional().default(0),
  netAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().min(0, "Paid amount must be non-negative").default(0),
  balanceAmount: z.coerce.number().default(0),
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

// Configuration for the 9 standardized package items
// This maps form fields (qtyKey) to yacht rate fields (rateKey) and provides labels
const allPackageItemConfigs: {
  qtyKey: keyof LeadFormData;
  rateKey: keyof Yacht;
  label: string;
  isGuestCount?: boolean;
}[] = [
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

const customChargeConfig = {
  qtyKey: 'othersAmtCake' as keyof LeadFormData, // Stores the quantity on the Lead
  rateKey: 'otherChargeRate' as keyof Yacht,   // Points to the rate on the Yacht object
  nameKey: 'otherChargeName' as keyof Yacht    // Points to the name of the custom charge on the Yacht object
};


const getDefaultFormValues = (): LeadFormData => ({
    id: undefined,
    agent: '', status: 'Upcoming', month: new Date(), yacht: '',
    type: 'Private', modeOfPayment: 'Online', clientName: '',
    notes: '', transactionId: '',
    // Default all package quantities to 0
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
        
        console.log('[LeadForm] Fetched Yachts:', yachtsData); // Log fetched yachts
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
  
  // Watch all individual package quantities
  const qty_childRate = form.watch('qty_childRate');
  const qty_adultStandardRate = form.watch('qty_adultStandardRate');
  const qty_adultStandardDrinksRate = form.watch('qty_adultStandardDrinksRate');
  const qty_vipChildRate = form.watch('qty_vipChildRate');
  const qty_vipAdultRate = form.watch('qty_vipAdultRate');
  const qty_vipAdultDrinksRate = form.watch('qty_vipAdultDrinksRate');
  const qty_royalChildRate = form.watch('qty_royalChildRate');
  const qty_royalAdultRate = form.watch('qty_royalAdultRate');
  const qty_royalDrinksRate = form.watch('qty_royalDrinksRate');

  const watchedCustomChargeQty = form.watch(customChargeConfig.qtyKey);
  const watchedPaidAmount = form.watch('paidAmount');

  // Effect for calculations
  useEffect(() => {
    console.log('[CalcDebug] Calculation useEffect triggered.');
    const selectedAgent = agents.find(a => a.id === watchedAgentId);
    const selectedYacht = yachts.find(y => y.id === watchedYachtId);

    console.log('[CalcDebug] Selected Agent:', selectedAgent ? {id: selectedAgent.id, name: selectedAgent.name, discount: selectedAgent.discount} : null);
    if(selectedYacht) {
      console.log('[CalcDebug] Selected Yacht ID:', selectedYacht.id, 'Name:', selectedYacht.name);
      console.log('[CalcDebug] Selected Yacht (Full Object for Rates Check):', JSON.parse(JSON.stringify(selectedYacht)));
    } else {
      console.log('[CalcDebug] No Yacht Selected or Yacht not found in local list.');
    }

    const agentDiscountRate = Number(selectedAgent?.discount || 0);
    // Only set commissionPercentage if it's different to avoid unnecessary re-renders/dirtying
    if (form.getValues('commissionPercentage') !== agentDiscountRate) {
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true, shouldDirty: true });
        console.log('[CalcDebug] Agent Discount Rate Set in form:', agentDiscountRate);
    }

    let currentTotalAmount = 0;
    let currentTotalGuests = 0;

    if (selectedYacht) {
      allPackageItemConfigs.forEach((pkgConfig) => {
        const quantity = Number(form.getValues(pkgConfig.qtyKey as keyof LeadFormData) || 0);
        // Defensive rate fetching
        const rateProperty = pkgConfig.rateKey as keyof Yacht;
        const rate = selectedYacht && typeof selectedYacht[rateProperty] === 'number' 
                     ? Number(selectedYacht[rateProperty]) 
                     : 0;
        
        console.log(`[CalcDebug] Package: ${pkgConfig.label}, Qty: ${quantity}, Rate from Yacht for ${String(rateProperty)}: ${rate}`);
        if (rate > 0 && quantity > 0) {
          currentTotalAmount += quantity * rate;
        }
        if (pkgConfig.isGuestCount && quantity > 0) {
          currentTotalGuests += quantity;
        }
      });

      // Handle custom charge
      const customChargeQtyValue = Number(form.getValues(customChargeConfig.qtyKey) || 0);
      const customChargeRateValue = selectedYacht && typeof selectedYacht[customChargeConfig.rateKey as keyof Yacht] === 'number'
                                    ? Number(selectedYacht[customChargeConfig.rateKey as keyof Yacht])
                                    : 0;
      console.log(`[CalcDebug] Custom Charge: Qty: ${customChargeQtyValue}, Rate: ${customChargeRateValue}`);
      if (customChargeRateValue > 0 && customChargeQtyValue > 0) {
        currentTotalAmount += customChargeQtyValue * customChargeRateValue;
      }
    }
    
    console.log('[CalcDebug] Calculated Total Guests:', currentTotalGuests);
    setCalculatedTotalGuests(currentTotalGuests);
    
    form.setValue('totalAmount', currentTotalAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Set Total Amount:', currentTotalAmount);

    const currentCommissionPercentage = form.getValues('commissionPercentage'); // Get potentially updated percentage
    const currentCommissionAmount = (currentTotalAmount * currentCommissionPercentage) / 100;
    form.setValue('commissionAmount', currentCommissionAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Using Commission Percentage:', currentCommissionPercentage, 'Set Commission Amount:', currentCommissionAmount);

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Set Net Amount:', currentNetAmount);
    
    const paidAmt = Number(watchedPaidAmount || 0);
    const actualBalanceAmount = currentNetAmount - paidAmt;
    form.setValue('balanceAmount', Math.abs(actualBalanceAmount), { shouldValidate: true, shouldDirty: true }); 
    console.log('[CalcDebug] Paid Amount from form:', paidAmt);
    console.log('[CalcDebug] Raw Balance Amount:', actualBalanceAmount);
    console.log('[CalcDebug] Set (Absolute) Balance Amount:', Math.abs(actualBalanceAmount));

  }, [
    watchedAgentId, watchedYachtId, 
    qty_childRate, qty_adultStandardRate, qty_adultStandardDrinksRate,
    qty_vipChildRate, qty_vipAdultRate, qty_vipAdultDrinksRate,
    qty_royalChildRate, qty_royalAdultRate, qty_royalDrinksRate,
    watchedCustomChargeQty, watchedPaidAmount, 
    form, agents, yachts // Ensure form, agents, and yachts are dependencies
  ]);


  useEffect(() => {
    if (isOpen) {
      const defaultVals = getDefaultFormValues();
      if (lead) {
        const leadMonthDate = lead.month && isValid(parseISO(lead.month)) ? parseISO(lead.month) : defaultVals.month;
        
        const resetValues: LeadFormData = {
          ...defaultVals, 
          ...lead,        
          month: leadMonthDate, 
          transactionId: lead.transactionId || defaultVals.transactionId,
          notes: lead.notes || defaultVals.notes,
          
          qty_childRate: lead.qty_childRate ?? 0,
          qty_adultStandardRate: lead.qty_adultStandardRate ?? 0,
          qty_adultStandardDrinksRate: lead.qty_adultStandardDrinksRate ?? 0,
          qty_vipChildRate: lead.qty_vipChildRate ?? 0,
          qty_vipAdultRate: lead.qty_vipAdultRate ?? 0,
          qty_vipAdultDrinksRate: lead.qty_vipAdultDrinksRate ?? 0,
          qty_royalChildRate: lead.qty_royalChildRate ?? 0,
          qty_royalAdultRate: lead.qty_royalAdultRate ?? 0,
          qty_royalDrinksRate: lead.qty_royalDrinksRate ?? 0,
          othersAmtCake: lead.othersAmtCake ?? 0,
          
          totalAmount: lead.totalAmount || 0,
          commissionPercentage: lead.commissionPercentage || 0, // This will be overridden by agent's discount if agent is set
          commissionAmount: lead.commissionAmount || 0,
          netAmount: lead.netAmount || 0,
          paidAmount: lead.paidAmount || 0,
          balanceAmount: Math.abs(lead.balanceAmount || 0), 
        };
        form.reset(resetValues);
      } else {
        form.reset(defaultVals);
      }
      
      // Trigger calculation after reset, especially for setting commission percentage
      // if an agent is pre-selected (e.g., when editing a lead)
      const currentAgentIdOnReset = form.getValues('agent');
      if (currentAgentIdOnReset && agents.length > 0) { // Ensure agents list is loaded
        const selectedAgentOnReset = agents.find(a => a.id === currentAgentIdOnReset);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0), { shouldValidate: true, shouldDirty: true });
      } else if (!currentAgentIdOnReset && !lead) { // If adding new lead and no agent selected yet
         form.setValue('commissionPercentage', 0, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [lead, form, isOpen, agents, yachts]); // Added agents, yachts as dependencies to re-trigger commission on open if lists change


  function onSubmit(data: LeadFormData) {
    const currentUserId = 'DO-user1'; // Placeholder, replace with actual logged-in user ID

    // Re-calculate final balance for submission to ensure it's the signed value
    const finalTotalAmount = data.totalAmount || 0;
    const finalCommissionPercentage = data.commissionPercentage || 0; // This is already set by effect
    const finalCommissionAmount = (finalTotalAmount * finalCommissionPercentage) / 100;
    const finalNetAmount = finalTotalAmount - finalCommissionAmount;
    const finalPaidAmount = data.paidAmount || 0;
    const actualSignedBalanceAmount = finalNetAmount - finalPaidAmount;

    const submittedLead: Lead = {
      ...data,
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      id: lead?.id || data.id, 
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId,
      ownerUserId: lead?.ownerUserId || currentUserId,
      
      // Ensure all numeric fields are numbers
      qty_childRate: Number(data.qty_childRate || 0),
      qty_adultStandardRate: Number(data.qty_adultStandardRate || 0),
      qty_adultStandardDrinksRate: Number(data.qty_adultStandardDrinksRate || 0),
      qty_vipChildRate: Number(data.qty_vipChildRate || 0),
      qty_vipAdultRate: Number(data.qty_vipAdultRate || 0),
      qty_vipAdultDrinksRate: Number(data.qty_vipAdultDrinksRate || 0),
      qty_royalChildRate: Number(data.qty_royalChildRate || 0),
      qty_royalAdultRate: Number(data.qty_royalAdultRate || 0),
      qty_royalDrinksRate: Number(data.qty_royalDrinksRate || 0),
      othersAmtCake: Number(data.othersAmtCake || 0),
      
      totalAmount: finalTotalAmount,
      commissionPercentage: finalCommissionPercentage,
      commissionAmount: finalCommissionAmount,
      netAmount: finalNetAmount,
      paidAmount: finalPaidAmount,
      balanceAmount: actualSignedBalanceAmount, // Submit the actual signed balance
    };
    onSubmitSuccess(submittedLead);
    onOpenChange(false); // Close dialog on submit
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
  if (form.watch('yacht') && selectedYachtForRateDisplay) { // Add this log
      console.log('[LeadForm LabelRender] Selected Yacht for Rate Display:', JSON.parse(JSON.stringify(selectedYachtForRateDisplay)));
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
            {/* Primary Lead Details Section */}
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
                        date={field.value ? (isValid(field.value) ? field.value : new Date()) : new Date()}
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

            {/* Package Item Quantities Section */}
            <div>
                <h3 className="text-lg font-medium pt-4 border-t mt-6 mb-2">Package Item Quantities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {allPackageItemConfigs.map(pkgFieldConfig => {
                    let rate = 0;
                    let rateDisplay = '(Select Yacht for Rate)';
                    if (selectedYachtForRateDisplay) {
                        const rateValue = selectedYachtForRateDisplay[pkgFieldConfig.rateKey as keyof Yacht];
                        // Log detailed info for the problematic field
                        if(pkgFieldConfig.rateKey === 'childRate') {
                           console.log(`[LabelDebug] For ${pkgFieldConfig.label} (rateKey: ${pkgFieldConfig.rateKey}): selectedYachtForRateDisplay.${pkgFieldConfig.rateKey} = `, rateValue);
                        }
                        if (typeof rateValue === 'number') {
                            rate = rateValue;
                            rateDisplay = `(Rate: ${rate} AED)`;
                        } else {
                           rateDisplay = `(Rate: N/A for ${String(pkgFieldConfig.rateKey)})`;
                        }
                    }
                    return (
                      <FormField
                      key={pkgFieldConfig.qtyKey}
                      control={form.control}
                      name={pkgFieldConfig.qtyKey as keyof LeadFormData}
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>{pkgFieldConfig.label} {rateDisplay}</FormLabel>
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
            
            {/* Custom Charge Section */}
            <h3 className="text-lg font-medium pt-4 border-t mt-6 mb-2">Custom Charge</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name={customChargeConfig.qtyKey} 
                    render={({ field }) => {
                        let customChargeNameOnYacht = selectedYachtForRateDisplay?.[customChargeConfig.nameKey as keyof Yacht];
                        let customChargeRateOnYacht = 0;
                        let rateDisplay = '(Select Yacht for Rate)';
                        
                        if (selectedYachtForRateDisplay) {
                            const rateValue = selectedYachtForRateDisplay[customChargeConfig.rateKey as keyof Yacht];
                            if (typeof rateValue === 'number') {
                                customChargeRateOnYacht = rateValue;
                                rateDisplay = `(Rate: ${customChargeRateOnYacht} AED)`;
                            } else {
                                rateDisplay = `(Rate: N/A for custom)`;
                            }
                            if (!customChargeNameOnYacht) {
                                customChargeNameOnYacht = 'Custom Charge'; // Default name if yacht doesn't provide one
                            }
                        }
                        
                        const labelText = customChargeNameOnYacht || 'Quantity for Custom Charge';
                        return (
                            <FormItem>
                                <FormLabel>{labelText} {rateDisplay}</FormLabel>
                                <FormControl><Input type="number" min="0" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
            </div>

            {/* Notes Section */}
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="pt-4 border-t mt-6">
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

            {/* Financials Section */}
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


  