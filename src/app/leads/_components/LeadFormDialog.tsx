
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import type { Lead, Agent, Yacht, ModeOfPayment, LeadStatus, LeadType, YachtPackageItem, LeadPackageQuantity, PaymentConfirmationStatus } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, yachtCategoryOptions, paymentConfirmationStatusOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { format, formatISO, parseISO, isValid } from 'date-fns';


const leadPackageQuantitySchema = z.object({
  packageId: z.string().min(1, "Package ID is required"), 
  packageName: z.string().min(1, "Package name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative").default(0),
  rate: z.coerce.number().min(0, "Rate must be non-negative").default(0), 
});

const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(leadStatusOptions), 
  month: z.date({ required_error: "Lead/Event Date is required." }), 
  notes: z.string().optional(),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.enum(leadTypeOptions, { required_error: "Lead type is required."}),
  paymentConfirmationStatus: z.enum(paymentConfirmationStatusOptions, { required_error: "Payment confirmation status is required."}),
  transactionId: z.string().optional(),
  modeOfPayment: z.enum(modeOfPaymentOptions),
  clientName: z.string().min(1, 'Client name is required'),
  
  packageQuantities: z.array(leadPackageQuantitySchema).optional().default([]),

  totalAmount: z.coerce.number().default(0),
  commissionPercentage: z.coerce.number().min(0).max(100).default(0),
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
  currentUserId?: string | null;
}

const getDefaultFormValues = (existingLead?: Lead | null, currentUserId?: string | null): LeadFormData => {
  let initialPackageQuantities: LeadPackageQuantity[] = [];
  if (existingLead?.packageQuantities && Array.isArray(existingLead.packageQuantities)) {
    initialPackageQuantities = existingLead.packageQuantities.map(pq => ({
      packageId: String(pq.packageId || ''),
      packageName: String(pq.packageName || 'Unknown Package'),
      quantity: Number(pq.quantity || 0),
      rate: Number(Number(pq.rate || 0).toFixed(2)),
    }));
  }

  return {
    id: existingLead?.id || undefined,
    agent: existingLead?.agent || '', 
    status: existingLead?.status || 'Balance', 
    month: existingLead?.month && isValid(parseISO(existingLead.month)) ? parseISO(existingLead.month) : new Date(),
    yacht: existingLead?.yacht || '',
    type: existingLead?.type || 'Private Cruise', 
    paymentConfirmationStatus: existingLead?.paymentConfirmationStatus || 'CONFIRMED',
    modeOfPayment: existingLead?.modeOfPayment || 'Online', 
    clientName: existingLead?.clientName || '',
    notes: existingLead?.notes || '', 
    transactionId: existingLead?.transactionId || '',
    packageQuantities: initialPackageQuantities,
    totalAmount: Number(Number(existingLead?.totalAmount || 0).toFixed(2)), 
    commissionPercentage: Number(existingLead?.commissionPercentage || 0), 
    commissionAmount: Number(Number(existingLead?.commissionAmount || 0).toFixed(2)), 
    netAmount: Number(Number(existingLead?.netAmount || 0).toFixed(2)),
    paidAmount: Number(Number(existingLead?.paidAmount || 0).toFixed(2)), 
    balanceAmount: Math.abs(Number(Number(existingLead?.balanceAmount || 0).toFixed(2))),
    lastModifiedByUserId: existingLead?.lastModifiedByUserId || currentUserId || undefined,
    ownerUserId: existingLead?.ownerUserId || currentUserId || undefined,
    createdAt: existingLead?.createdAt || undefined,
    updatedAt: existingLead?.updatedAt || undefined,
  };
};


export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess, currentUserId }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [calculatedTotalGuests, setCalculatedTotalGuests] = useState(0);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: getDefaultFormValues(lead, currentUserId),
  });

  const { fields: packageQuantityFields, replace: replacePackageQuantities } = useFieldArray({
    control: form.control,
    name: "packageQuantities",
  });

  const watchedLeadType = form.watch('type');
  const watchedYachtId = form.watch('yacht');
  const watchedAgentId = form.watch('agent');
  const watchedPaidAmount = form.watch('paidAmount');
  const watchedPackageQuantities = form.watch('packageQuantities');


  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoadingDropdowns(true);
      try {
        const [agentsRes, yachtsRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/yachts'),
        ]);
        if (!agentsRes.ok) throw new Error('Failed to fetch agents for form');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts for form');

        const agentsData = await agentsRes.json();
        const yachtsData = await yachtsRes.json();
        
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        console.log('[LeadForm] Fetched Agents count:', agentsData.length);
        console.log('[LeadForm] Fetched Yachts count:', yachtsData.length);
        if (yachtsData.length > 0 && yachtsData[0].packages) {
            console.log('[LeadForm] First yacht packages sample:', JSON.parse(JSON.stringify(yachtsData[0].packages.slice(0,2))));
        }

      } catch (error) {
        console.error("Error fetching dropdown data for Lead Form:", error);
        toast({ title: 'Error loading form data', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen, toast]); 


  const filteredYachts = useMemo(() => {
    if (!watchedLeadType || allYachts.length === 0) {
       return allYachts;
    }
    const filtered = allYachts.filter(yacht => yacht.category === watchedLeadType);
    return filtered;
  }, [watchedLeadType, allYachts]);


  useEffect(() => {
    if (!isOpen || isLoadingDropdowns || !watchedYachtId) {
        if (!watchedYachtId && form.getValues('packageQuantities')?.length > 0) {
            console.log('[LeadForm PQ Effect] No yacht selected, clearing packageQuantities.');
            replacePackageQuantities([]);
        }
        return;
    }

    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);
    console.log('[LeadForm PQ Effect] Yacht ID changed. WatchedYachtID:', watchedYachtId);
    console.log('[LeadForm PQ Effect] Selected Yacht for packages:', selectedYacht ? {id: selectedYacht.id, name: selectedYacht.name, packages: JSON.parse(JSON.stringify(selectedYacht.packages))} : 'None');

    if (selectedYacht && selectedYacht.packages && Array.isArray(selectedYacht.packages)) {
      const newPQs = selectedYacht.packages.map(yachtPkg => {
        const existingLeadPQ = lead?.packageQuantities?.find(lpq => lpq.packageId === yachtPkg.id);
        const rateFromYacht = Number(Number(yachtPkg.rate || 0).toFixed(2)); 
        return {
          packageId: String(yachtPkg.id || `pkg-id-${Date.now()}-${Math.random()}`),
          packageName: String(yachtPkg.name || 'Unnamed Package'),
          quantity: existingLeadPQ ? Number(existingLeadPQ.quantity || 0) : 0,
          rate: rateFromYacht, 
        };
      });
      console.log('[LeadForm PQ Effect] Populating packageQuantities based on selected yacht. New PQs:', JSON.parse(JSON.stringify(newPQs)));
      replacePackageQuantities(newPQs);
      form.trigger(); 
    } else {
      console.log('[LeadForm PQ Effect] No valid packages on selected yacht or yacht not found, clearing packageQuantities.');
      replacePackageQuantities([]);
      form.trigger();
    }
  }, [isOpen, watchedYachtId, allYachts, replacePackageQuantities, lead, isLoadingDropdowns, form]);


  useEffect(() => {
    console.log('[CalcDebug] --- Calculation Effect Fired ---');
    const currentYachtId = watchedYachtId;
    const currentAgentId = watchedAgentId;
    const currentPackageQuantities = watchedPackageQuantities || []; 
    const currentPaidAmountValue = form.getValues('paidAmount'); 
    const currentPaidAmount = Number(Number(currentPaidAmountValue || 0).toFixed(2));

    console.log('[CalcDebug] Watched Values: YachtID=', currentYachtId, 'AgentID=', currentAgentId, 'PaidAmountInput=', currentPaidAmountValue, 'NumericPaid=', currentPaidAmount);
    console.log('[CalcDebug] Watched PackageQuantities:', JSON.parse(JSON.stringify(currentPackageQuantities)));

    const selectedYachtForCalc = allYachts.find(y => y.id === currentYachtId);

    if (!selectedYachtForCalc || !selectedYachtForCalc.packages) {
      console.warn('[CalcDebug] No yacht selected or found, or yacht has no packages. WatchedYachtID:', currentYachtId);
      form.setValue('totalAmount', 0);
      form.setValue('commissionAmount', 0);
      form.setValue('netAmount', 0);
      form.setValue('balanceAmount', Math.abs(0 - currentPaidAmount));
      setCalculatedTotalGuests(0);
      return;
    }
    console.log('[CalcDebug] Using Yacht for Calc:', selectedYachtForCalc.name, 'Packages:', selectedYachtForCalc.packages);

    let rawCalculatedTotalAmount = 0;
    let calculatedTotalGuests = 0;

    currentPackageQuantities.forEach((pqItem, index) => {
      const quantity = Number(pqItem.quantity || 0);
      const yachtPackageDetails = selectedYachtForCalc.packages?.find(p => p.id === pqItem.packageId);
      const rateFromYacht = yachtPackageDetails ? Number(Number(yachtPackageDetails.rate || 0).toFixed(2)) : 0;

      console.log(`[CalcDebug] Processing PkgItem[${index}]: ID='${pqItem.packageId}', Name='${pqItem.packageName}', Qty=${quantity}, RateFromYacht=${rateFromYacht}`);
      
      if (quantity > 0 && rateFromYacht > 0) {
        rawCalculatedTotalAmount += quantity * rateFromYacht;
      }
      calculatedTotalGuests += quantity;
    });
    
    setCalculatedTotalGuests(calculatedTotalGuests);
    const calculatedTotalAmount = Number(rawCalculatedTotalAmount.toFixed(2));
    form.setValue('totalAmount', calculatedTotalAmount);

    const selectedAgentForCalc = allAgents.find(a => a.id === currentAgentId);
    const agentDiscountRate = selectedAgentForCalc ? Number(selectedAgentForCalc.discount || 0) : 0;

    if (form.getValues('commissionPercentage') !== agentDiscountRate) {
      form.setValue('commissionPercentage', agentDiscountRate);
    }

    const calculatedCommissionAmount = Number(((calculatedTotalAmount * agentDiscountRate) / 100).toFixed(2));
    form.setValue('commissionAmount', calculatedCommissionAmount);

    const calculatedNetAmount = Number((calculatedTotalAmount - calculatedCommissionAmount).toFixed(2));
    form.setValue('netAmount', calculatedNetAmount);
    
    const actualSignedBalanceAmount = Number((calculatedNetAmount - currentPaidAmount).toFixed(2));
    form.setValue('balanceAmount', Math.abs(actualSignedBalanceAmount));

    console.log(`[CalcDebug] Final Amounts: TotalGuests=${calculatedTotalGuests}, Total=${calculatedTotalAmount}, CommissionPerc=${agentDiscountRate}%, CommissionAmt=${calculatedCommissionAmount}, Net=${calculatedNetAmount}, Paid=${currentPaidAmount}, Balance=${Math.abs(actualSignedBalanceAmount)} (Signed: ${actualSignedBalanceAmount})`);
    console.log('[CalcDebug] --- Calculation Effect End ---');

  }, [
    watchedPackageQuantities, 
    watchedYachtId, 
    watchedAgentId, 
    watchedPaidAmount, 
    allYachts, 
    allAgents, 
    form, 
    setCalculatedTotalGuests
  ]);


  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultFormValues(lead, currentUserId));
      console.log('[LeadForm] Form reset. Lead:', lead ? JSON.parse(JSON.stringify(lead)) : 'New Lead');
      
      const agentIdForCommission = lead?.agent || form.getValues('agent');
      if (agentIdForCommission && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === agentIdForCommission);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0));
         console.log(`[LeadForm] Reset: Commission set to ${selectedAgentOnReset?.discount || 0}% for agent ${agentIdForCommission}`);
      } else if (!agentIdForCommission) {
         form.setValue('commissionPercentage', 0);
         console.log(`[LeadForm] Reset: No agent, commission set to 0%`);
      }
    }
  }, [lead, form, isOpen, allAgents, allYachts, currentUserId]); 


  function onSubmit(data: LeadFormData) {
    let rawFinalTotalAmount = 0;
    const selectedYachtForSubmit = allYachts.find(y => y.id === data.yacht);

    if (data.packageQuantities && Array.isArray(data.packageQuantities) && selectedYachtForSubmit && selectedYachtForSubmit.packages && Array.isArray(selectedYachtForSubmit.packages)) {
      data.packageQuantities.forEach(pqItem => {
        const quantity = Number(pqItem.quantity || 0);
        const yachtPackage = selectedYachtForSubmit.packages?.find(p => p.id === pqItem.packageId);
        const rate = yachtPackage ? Number(Number(yachtPackage.rate || 0).toFixed(2)) : 0;
        if (quantity > 0 && rate > 0) {
          rawFinalTotalAmount += quantity * rate;
        }
      });
    }
    const finalTotalAmount = Number(rawFinalTotalAmount.toFixed(2));
    
    const selectedAgentForSubmit = allAgents.find(a => a.id === data.agent);
    const finalCommissionPercentage = selectedAgentForSubmit ? Number(selectedAgentForSubmit.discount || 0) : 0;
    const finalCommissionAmount = Number(((finalTotalAmount * finalCommissionPercentage) / 100).toFixed(2));
    const finalNetAmount = Number((finalTotalAmount - finalCommissionAmount).toFixed(2));
    const finalPaidAmount = Number(Number(data.paidAmount || 0).toFixed(2));
    const actualSignedBalanceAmount = Number((finalNetAmount - finalPaidAmount).toFixed(2));

    const finalPackageQuantities = (data.packageQuantities && Array.isArray(data.packageQuantities) && selectedYachtForSubmit && selectedYachtForSubmit.packages && Array.isArray(selectedYachtForSubmit.packages))
      ? data.packageQuantities.map(pq => {
          const yachtPackage = selectedYachtForSubmit.packages?.find(p => p.id === pq.packageId);
          const rate = yachtPackage ? Number(Number(yachtPackage.rate || 0).toFixed(2)) : 0; 
          return {
            packageId: String(pq.packageId),
            packageName: String(pq.packageName),
            quantity: Number(pq.quantity || 0),
            rate: rate, 
          };
        })
      : [];

    const submittedLead: Lead = {
      ...data, 
      id: lead?.id || `temp-${Date.now()}`, 
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      paymentConfirmationStatus: data.paymentConfirmationStatus,
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId || undefined, // Use currentUserId from props
      ownerUserId: lead?.ownerUserId || currentUserId || undefined, // Use currentUserId for new leads or preserve existing
      
      packageQuantities: finalPackageQuantities,
      totalAmount: finalTotalAmount,
      commissionPercentage: finalCommissionPercentage,
      commissionAmount: finalCommissionAmount,
      netAmount: finalNetAmount,
      paidAmount: finalPaidAmount,
      balanceAmount: actualSignedBalanceAmount, 
    };
    console.log("[LeadFormDialog] Submitting lead:", JSON.parse(JSON.stringify(submittedLead, null, 2)));
    onSubmitSuccess(submittedLead);
    onOpenChange(false);
  }
  
  const selectedYachtForRateDisplay = useMemo(() => {
    return allYachts.find(y => y.id === watchedYachtId);
  }, [watchedYachtId, allYachts]);


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
                        {allAgents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}
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
                            if (date) {
                                field.onChange(date);
                            }
                        }}
                        placeholder="Pick event date"
                    />
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
                     <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('yacht', ''); 
                            replacePackageQuantities([]); 
                        }} 
                        value={field.value || undefined} 
                        defaultValue={field.value}
                     >
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
                name="yacht"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yacht</FormLabel>
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                        }} 
                        value={field.value || undefined} 
                        defaultValue={field.value} 
                        disabled={!watchedLeadType || isLoadingDropdowns || filteredYachts.length === 0}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder={!watchedLeadType ? "Select Lead Type first" : (filteredYachts.length === 0 && !isLoadingDropdowns ? "No yachts for this type" : "Select a yacht")} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {filteredYachts.map((yacht) => (<SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>))}
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
                name="paymentConfirmationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment/Confirmation Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select payment/confirmation status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {paymentConfirmationStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
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

            
            {watchedYachtId && packageQuantityFields.length > 0 && (
              <div className="pt-4 border-t mt-6">
                  <h3 className="text-lg font-medium mb-1">Package Item Quantities</h3>
                  <p className="text-sm text-muted-foreground mb-3">Enter quantities for packages offered by the selected yacht. Rates are shown for reference.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 mt-2">
                    {packageQuantityFields.map((fieldItem, index) => {
                      return (
                        <FormField
                          key={fieldItem.id} 
                          control={form.control}
                          name={`packageQuantities.${index}.quantity`}
                          render={({ field: qtyField }) => (
                            <FormItem>
                              <FormLabel>{fieldItem.packageName} (Rate: {Number(fieldItem.rate || 0).toFixed(2)} AED)</FormLabel>
                              <FormControl>
                                  <Input type="number" min="0" placeholder="0" {...qtyField} onChange={e => qtyField.onChange(parseInt(e.target.value,10) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    })}
                  </div>
              </div>
            )}
             {watchedYachtId && (!selectedYachtForRateDisplay || !selectedYachtForRateDisplay.packages || selectedYachtForRateDisplay.packages.length === 0) && !isLoadingDropdowns && (
                <div className="pt-4 border-t mt-6">
                    <p className="text-muted-foreground">The selected yacht currently has no packages defined. Please add packages in the Yacht Management section.</p>
                </div>
            )}
            

            
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} value={Number(field.value).toFixed(2)} readOnly className="bg-muted/50" /></FormControl>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} value={Number(field.value).toFixed(2)} readOnly className="bg-muted/50" /></FormControl>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} value={Number(field.value).toFixed(2)} readOnly className="bg-muted/50" /></FormControl>
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
                      <FormControl><Input type="number" min="0" placeholder="0.00" {...field} onChange={e => field.onChange(e.target.value)} /></FormControl>
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
                      <FormControl><Input type="number" placeholder="0.00" {...field} value={Number(field.value).toFixed(2)} readOnly className="bg-muted/50" /></FormControl>
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
