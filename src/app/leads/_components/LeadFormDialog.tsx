
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
import type { Lead, Agent, Yacht, ModeOfPayment, LeadStatus, LeadType, LeadPackageQuantity, YachtPackageItem } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { format, formatISO, parseISO, isValid } from 'date-fns';

const leadPackageQuantitySchema = z.object({
  packageId: z.string(),
  packageName: z.string(),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative").default(0),
  rate: z.coerce.number().min(0).default(0), // Rate at the time of booking
});

const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(leadStatusOptions),
  month: z.date({ required_error: "Lead/Event Date is required." }), // This is the Lead/Event Date
  notes: z.string().optional(),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.enum(leadTypeOptions, { required_error: "Lead type is required."}),
  transactionId: z.string().optional(),
  modeOfPayment: z.enum(modeOfPaymentOptions),
  clientName: z.string().min(1, 'Client name is required'),
  
  packageQuantities: z.array(leadPackageQuantitySchema).optional().default([]),

  totalAmount: z.coerce.number().default(0),
  commissionPercentage: z.coerce.number().min(0, "Commission must be non-negative").max(100, "Commission cannot exceed 100%").default(0),
  commissionAmount: z.coerce.number().optional().default(0),
  netAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().min(0, "Paid amount must be non-negative").default(0),
  balanceAmount: z.coerce.number().default(0), // Displayed as absolute, stored signed
  
  createdAt: z.string().optional(), // ISO string
  updatedAt: z.string().optional(), // ISO string
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

const SIMULATED_CURRENT_USER_ID = 'DO-user1';

const getDefaultFormValues = (): LeadFormData => ({
    id: undefined,
    agent: '', status: 'Upcoming', month: new Date(), yacht: '',
    type: 'Dinner Cruise', modeOfPayment: 'Online', clientName: '',
    notes: '', transactionId: '',
    packageQuantities: [],
    totalAmount: 0, commissionPercentage: 0, commissionAmount:0, netAmount: 0,
    paidAmount: 0, balanceAmount: 0,
    lastModifiedByUserId: SIMULATED_CURRENT_USER_ID,
    ownerUserId: undefined,
    createdAt: undefined,
    updatedAt: undefined,
});


export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [calculatedTotalGuests, setCalculatedTotalGuests] = useState(0);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: getDefaultFormValues(),
  });

  const { fields: packageQuantityFields, replace: replacePackageQuantities, control } = useFieldArray({
    control: form.control,
    name: "packageQuantities",
  });

  const watchedLeadType = form.watch('type');
  const watchedYachtId = form.watch('yacht');
  const watchedAgentId = form.watch('agent');
  const watchedPaidAmount = form.watch('paidAmount');
  const watchedPackageQuantities = form.watch('packageQuantities'); // Watch the entire array

  // Fetch Agents and Yachts for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
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
        
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        console.log('[LeadForm] Fetched Agents for dropdown:', agentsData.length > 0 ? agentsData[0] : 'No agents');
        console.log('[LeadForm] Fetched Yachts for dropdown:', yachtsData.length > 0 ? yachtsData[0] : 'No yachts');
        if(yachtsData.length > 0 && yachtsData[0].packages) console.log('[LeadForm] First yacht packages from API:', yachtsData[0].packages);

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
  }, [isOpen]);


  const filteredYachts = useMemo(() => {
    if (!watchedLeadType || allYachts.length === 0) return allYachts;
    return allYachts.filter(yacht => yacht.category === watchedLeadType);
  }, [watchedLeadType, allYachts]);

  // Effect to update package quantities in the form when yacht changes or when editing a lead
  useEffect(() => {
    if (!isOpen || allYachts.length === 0) return; 

    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);
    console.log('[LeadForm PQ Effect] Yacht ID or dependencies changed. WatchedYachtID:', watchedYachtId);
    console.log('[LeadForm PQ Effect] Selected Yacht for packages:', selectedYacht ? {id: selectedYacht.id, name: selectedYacht.name, packages: selectedYacht.packages} : 'None');

    if (selectedYacht && selectedYacht.packages && Array.isArray(selectedYacht.packages)) {
      let initialPackageQuantities: LeadPackageQuantity[];

      if (lead && lead.packageQuantities && lead.packageQuantities.length > 0 && lead.yacht === selectedYacht.id) {
        // Editing an existing lead, and the yacht matches: try to use existing quantities & rates
        console.log('[LeadForm PQ Effect] Editing lead. Matching existing PQs with yacht packages. Lead PQs:', JSON.parse(JSON.stringify(lead.packageQuantities)));
        initialPackageQuantities = selectedYacht.packages.map(yachtPkg => {
          const existingLeadPQ = lead.packageQuantities!.find(lpq => lpq.packageId === yachtPkg.id);
          const rateFromYacht = Number(yachtPkg.rate || 0);
          console.log(`[LeadForm PQ Effect - Yacht Pkg Item for Edit] Name: ${yachtPkg.name}, Raw Rate from Yacht Object: ${yachtPkg.rate}, Parsed Rate: ${rateFromYacht}`);
          return {
            packageId: String(yachtPkg.id || `pkg-id-${Date.now()}-${Math.random()}`),
            packageName: String(yachtPkg.name || 'Unnamed Package'),
            quantity: existingLeadPQ ? Number(existingLeadPQ.quantity || 0) : 0,
            rate: existingLeadPQ ? Number(existingLeadPQ.rate || rateFromYacht) : rateFromYacht, // Prefer rate from lead if exists, else from yacht
          };
        });
      } else {
        // New lead, or yacht changed, or lead has no PQs/mismatched yacht: set quantities to 0, rates from yacht
        console.log('[LeadForm PQ Effect] New lead or yacht changed. Populating PQs from yacht packages with qty 0.');
        initialPackageQuantities = selectedYacht.packages.map(yachtPkg => {
          const rateFromYacht = Number(yachtPkg.rate || 0);
           console.log(`[LeadForm PQ Effect - Yacht Pkg Item for New/Change] Name: ${yachtPkg.name}, Raw Rate from Yacht Object: ${yachtPkg.rate}, Parsed Rate: ${rateFromYacht}`);
          return {
            packageId: String(yachtPkg.id || `pkg-id-${Date.now()}-${Math.random()}`),
            packageName: String(yachtPkg.name || 'Unnamed Package'),
            quantity: 0,
            rate: rateFromYacht, 
          };
        });
      }
      console.log('[LeadForm PQ Effect] Initial PackageQuantities to set in form state:', JSON.parse(JSON.stringify(initialPackageQuantities)));
      replacePackageQuantities(initialPackageQuantities);
    } else if (!watchedYachtId && form.getValues('packageQuantities').length > 0) {
      console.log('[LeadForm PQ Effect] No yacht selected, clearing packageQuantities.');
      replacePackageQuantities([]);
    }
  }, [isOpen, watchedYachtId, lead, allYachts, replacePackageQuantities, form ]);


  // Effect for financial calculations
  useEffect(() => {
    console.log('[CalcDebug] Financial calculation useEffect triggered.');
    const currentFormData = form.getValues(); 
    console.log('[CalcDebug] Watched PQs for calc:', JSON.parse(JSON.stringify(watchedPackageQuantities)));
    console.log('[CalcDebug] Current form data for calculation:', JSON.parse(JSON.stringify(currentFormData)));


    const selectedAgent = allAgents.find(a => a.id === currentFormData.agent);
    const agentDiscountRate = selectedAgent ? Number(selectedAgent.discount || 0) : 0;
    if (form.getValues('commissionPercentage') !== agentDiscountRate) {
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    }
    console.log(`[CalcDebug] Agent: ${selectedAgent?.name}, Discount Rate: ${agentDiscountRate}%`);

    let currentTotalAmount = 0;
    let currentTotalGuestsFromPackages = 0;
    const currentPQs = currentFormData.packageQuantities || []; 

    if (currentPQs && currentPQs.length > 0) {
      console.log('[CalcDebug] Calculating from packageQuantities in form state:', JSON.parse(JSON.stringify(currentPQs)));
      currentPQs.forEach((pqItem, index) => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(pqItem.rate || 0); // Rate stored in the form state item
        console.log(`[CalcDebug] PackageItem ${index}: Name='${pqItem.packageName}', Qty=${quantity}, Stored Rate=${rate}`);
        if (quantity > 0 && rate > 0) {
          currentTotalAmount += quantity * rate;
        }
        currentTotalGuestsFromPackages += quantity;
      });
    } else {
      console.log('[CalcDebug] No packageQuantities to calculate from or array is empty.');
    }
    
    setCalculatedTotalGuests(currentTotalGuestsFromPackages);
    form.setValue('totalAmount', currentTotalAmount, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

    const currentCommissionPercentage = form.getValues('commissionPercentage');
    const currentCommissionAmount = (currentTotalAmount * Number(currentCommissionPercentage || 0)) / 100;
    form.setValue('commissionAmount', currentCommissionAmount, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    
    const paidAmt = Number(currentFormData.paidAmount || 0);
    const actualSignedBalanceAmount = currentNetAmount - paidAmt;
    form.setValue('balanceAmount', Math.abs(actualSignedBalanceAmount), { shouldValidate: true, shouldDirty: true, shouldTouch: true }); 

    console.log(`[CalcDebug] Calculated Guests=${currentTotalGuestsFromPackages}, Total=${currentTotalAmount}, Commission=${currentCommissionAmount}, Net=${currentNetAmount}, Paid=${paidAmt}, Balance=${Math.abs(actualSignedBalanceAmount)}`);

  }, [
    watchedPackageQuantities, 
    watchedAgentId, 
    watchedPaidAmount, 
    watchedYachtId, 
    allAgents, 
    allYachts, 
    form 
  ]);


  // Effect to reset form when dialog opens or lead (for editing) changes
  useEffect(() => {
    if (isOpen) {
      const defaultVals = getDefaultFormValues();
      if (lead) { 
        const leadMonthDate = lead.month && isValid(parseISO(lead.month)) ? parseISO(lead.month) : defaultVals.month;
        
        // Package quantities will be set by the other effect watching `watchedYachtId` and `lead`
        const resetValues: LeadFormData = {
          ...defaultVals, 
          ...lead,        
          month: leadMonthDate, 
          transactionId: lead.transactionId || defaultVals.transactionId,
          notes: lead.notes || defaultVals.notes,
          packageQuantities: [], // Will be populated by the other effect
          totalAmount: Number(lead.totalAmount || 0),
          commissionPercentage: Number(lead.commissionPercentage || 0), // Will be updated by agent selection
          commissionAmount: Number(lead.commissionAmount || 0),
          netAmount: Number(lead.netAmount || 0),
          paidAmount: Number(lead.paidAmount || 0),
          balanceAmount: Math.abs(Number(lead.balanceAmount || 0)), 
        };
        form.reset(resetValues);
        console.log('[LeadForm] Form reset for editing lead. Initial PQs empty, will be set by yacht effect.', JSON.parse(JSON.stringify(resetValues)));
      } else { 
        form.reset(defaultVals);
        replacePackageQuantities([]); 
        console.log('[LeadForm] Form reset for new lead.');
      }
      
      const currentAgentIdOnReset = form.getValues('agent');
      if (currentAgentIdOnReset && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === currentAgentIdOnReset);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0), { shouldValidate: true });
      } else if (!currentAgentIdOnReset && !lead) { 
         form.setValue('commissionPercentage', 0, { shouldValidate: true });
      }
    }
  }, [lead, form, isOpen, allAgents, allYachts, replacePackageQuantities]);


  function onSubmit(data: LeadFormData) {
    let finalTotalAmount = 0;
    let finalPackageQuantities: LeadPackageQuantity[] = [];
    let finalTotalGuests = 0;

    const currentPQs = form.getValues('packageQuantities') || [];
    if (currentPQs && currentPQs.length > 0) {
      finalPackageQuantities = currentPQs.map(pqItem => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(pqItem.rate || 0); 
        if (quantity > 0 && rate > 0) {
          finalTotalAmount += quantity * rate;
        }
        finalTotalGuests += quantity;
        return {
          packageId: String(pqItem.packageId),
          packageName: String(pqItem.packageName),
          quantity: quantity,
          rate: rate, 
        };
      });
    }
    
    const finalCommissionPercentage = Number(data.commissionPercentage || 0);
    const finalCommissionAmount = (finalTotalAmount * finalCommissionPercentage) / 100;
    const finalNetAmount = finalTotalAmount - finalCommissionAmount;
    const finalPaidAmount = Number(data.paidAmount || 0);
    const actualSignedBalanceAmount = finalNetAmount - finalPaidAmount;

    const submittedLead: Lead = {
      ...data, 
      id: lead?.id || data.id, 
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: SIMULATED_CURRENT_USER_ID,
      ownerUserId: lead?.ownerUserId || SIMULATED_CURRENT_USER_ID,
      
      packageQuantities: finalPackageQuantities,
      totalAmount: finalTotalAmount,
      commissionPercentage: finalCommissionPercentage,
      commissionAmount: finalCommissionAmount,
      netAmount: finalNetAmount,
      paidAmount: finalPaidAmount,
      balanceAmount: actualSignedBalanceAmount, // Store signed value
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
                            // Package quantities will be updated by the useEffect watching watchedYachtId
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

            {/* Dynamic Package Item Quantities Section */}
            {watchedYachtId && packageQuantityFields.length > 0 && (
              <div className="pt-4 border-t mt-6">
                  <h3 className="text-lg font-medium mb-1">Package Item Quantities</h3>
                  <p className="text-sm text-muted-foreground mb-3">Enter quantities for packages offered by the selected yacht. Rates are shown for reference.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 mt-2">
                    {packageQuantityFields.map((fieldItem, index) => {
                      const rateForLabel = Number(fieldItem.rate || 0);
                       console.log(`[LeadForm LabelRender] Rendering PQ Input for: ${fieldItem.packageName}, fieldItem.id: ${fieldItem.id}, Rate for Label: ${rateForLabel}`);
                      return (
                        <FormField
                          key={fieldItem.id} 
                          control={form.control}
                          name={`packageQuantities.${index}.quantity`}
                          render={({ field: qtyField }) => (
                            <FormItem>
                              <FormLabel>{fieldItem.packageName} (Rate: {rateForLabel.toFixed(2)} AED)</FormLabel>
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
             {watchedYachtId && selectedYachtForRateDisplay && (!selectedYachtForRateDisplay.packages || selectedYachtForRateDisplay.packages.length === 0) && (
                <div className="pt-4 border-t mt-6">
                    <p className="text-muted-foreground">The selected yacht currently has no packages defined. Please add packages in the Yacht Management section.</p>
                </div>
            )}
            

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

    