
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

// This schema should match the LeadPackageQuantity type
const leadPackageQuantitySchema = z.object({
  packageId: z.string().min(1, "Package ID is required"),
  packageName: z.string().min(1, "Package name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative").default(0),
  rate: z.coerce.number().min(0, "Rate must be non-negative").default(0), // Rate at the time of booking
});

const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().min(1, 'Agent is required'),
  status: z.enum(leadStatusOptions),
  month: z.date({ required_error: "Lead/Event Date is required." }), // This is the Lead/Event Date (will be converted to ISO string on submit)
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
    agent: '', 
    status: 'Upcoming', 
    month: new Date(), // Lead/Event Date
    yacht: '',
    type: 'Private Cruise', 
    modeOfPayment: 'Online', 
    clientName: '',
    notes: '', 
    transactionId: '',
    packageQuantities: [],
    totalAmount: 0, 
    commissionPercentage: 0, 
    commissionAmount:0, 
    netAmount: 0,
    paidAmount: 0, 
    balanceAmount: 0,
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
  // Watch the entire packageQuantities array. Changes to items (e.g., quantity) will trigger this.
  const watchedPackageQuantities = form.watch('packageQuantities');


  // Fetch Agents and Yachts for dropdowns
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
        console.log('[LeadForm] Fetched Agents for dropdown:', agentsData.length > 0 ? agentsData[0]?.id : 'No agents');
        console.log('[LeadForm] Fetched Yachts for dropdown:', yachtsData.length > 0 ? {id: yachtsData[0]?.id, packages: yachtsData[0]?.packages} : 'No yachts');

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
  }, [isOpen, toast]); // Removed form.reset dep, handled in separate effect


  const filteredYachts = useMemo(() => {
    if (!watchedLeadType || allYachts.length === 0) return allYachts;
    console.log(`[LeadForm] Filtering yachts for type: ${watchedLeadType}. Available yachts: ${allYachts.length}`);
    const filtered = allYachts.filter(yacht => yacht.category === watchedLeadType);
    console.log(`[LeadForm] Filtered yachts count: ${filtered.length}`);
    return filtered;
  }, [watchedLeadType, allYachts]);

  // Effect to populate/update packageQuantities in the form when yacht changes or when editing a lead
  useEffect(() => {
    if (!isOpen) return; // Only run if dialog is open

    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);
    console.log('[LeadForm PQ Effect] Yacht ID or isOpen changed. WatchedYachtID:', watchedYachtId, 'Selected Yacht:', selectedYacht ? {id: selectedYacht.id, name: selectedYacht.name, packages: selectedYacht.packages} : 'None');

    if (selectedYacht && selectedYacht.packages && Array.isArray(selectedYacht.packages)) {
      const newPQs = selectedYacht.packages.map(yachtPkg => {
        const existingLeadPQ = lead?.packageQuantities?.find(lpq => lpq.packageId === yachtPkg.id);
        return {
          packageId: String(yachtPkg.id || `pkg-id-${Date.now()}-${Math.random()}`),
          packageName: String(yachtPkg.name || 'Unnamed Package'),
          quantity: existingLeadPQ ? Number(existingLeadPQ.quantity || 0) : 0,
          rate: Number(yachtPkg.rate || 0), // CRUCIAL: Copy the rate from yacht to form state
        };
      });
      console.log('[LeadForm PQ Effect] Populating packageQuantities based on selected yacht:', JSON.parse(JSON.stringify(newPQs)));
      replacePackageQuantities(newPQs); // This updates the form state for packageQuantities
    } else if (!watchedYachtId && form.getValues('packageQuantities')?.length > 0) {
      console.log('[LeadForm PQ Effect] No yacht selected, clearing packageQuantities.');
      replacePackageQuantities([]);
    }
  }, [isOpen, watchedYachtId, allYachts, replacePackageQuantities, lead]); // Added lead to ensure existing values are used if editing


  // Effect for financial calculations
  useEffect(() => {
    console.log('[CalcDebug] Financial calculation useEffect triggered. Dependencies:', {
      watchedPackageQuantities: JSON.parse(JSON.stringify(watchedPackageQuantities)),
      watchedAgentId,
      watchedPaidAmount,
      watchedYachtId,
      allAgentsLength: allAgents.length,
      allYachtsLength: allYachts.length,
    });

    const currentFormData = form.getValues(); // Get fresh form values

    const selectedAgentForCalc = allAgents.find(a => a.id === currentFormData.agent);
    const selectedYachtForCalc = allYachts.find(y => y.id === currentFormData.yacht);

    console.log('[CalcDebug] Selected Agent for Calc:', selectedAgentForCalc ? {id: selectedAgentForCalc.id, name: selectedAgentForCalc.name, discount: selectedAgentForCalc.discount} : 'None');
    console.log('[CalcDebug] Selected Yacht for Calc:', selectedYachtForCalc ? {id: selectedYachtForCalc.id, name: selectedYachtForCalc.name, packages: selectedYachtForCalc.packages} : 'None');

    let currentTotalAmount = 0;
    let currentTotalGuestsFromPackages = 0;

    if (selectedYachtForCalc && selectedYachtForCalc.packages && currentFormData.packageQuantities) {
      console.log('[CalcDebug] currentFormData.packageQuantities for iteration:', JSON.parse(JSON.stringify(currentFormData.packageQuantities)));
      currentFormData.packageQuantities.forEach((pqItem, index) => {
        const quantity = Number(pqItem.quantity || 0);
        // Directly fetch the rate from the selectedYachtForCalc.packages using packageId
        const yachtPackage = selectedYachtForCalc.packages?.find(p => p.id === pqItem.packageId);
        const rate = yachtPackage ? Number(yachtPackage.rate || 0) : 0; 

        console.log(`[CalcDebug] PackageItem ${index}: Name='${pqItem.packageName}', Qty=${quantity}, Fetched Rate=${rate} (from packageId: ${pqItem.packageId})`);

        if (quantity > 0 && rate > 0) {
          currentTotalAmount += quantity * rate;
        }
        currentTotalGuestsFromPackages += quantity; // Assuming all package items contribute to guest count
      });
    } else {
      console.log('[CalcDebug] Skipping package amount calculation: No selected yacht, yacht packages, or lead packageQuantities.');
    }
    
    setCalculatedTotalGuests(currentTotalGuestsFromPackages);
    form.setValue('totalAmount', currentTotalAmount, { shouldValidate: true, shouldDirty: true });

    const agentDiscountRate = selectedAgentForCalc ? Number(selectedAgentForCalc.discount || 0) : 0;
    if (form.getValues('commissionPercentage') !== agentDiscountRate) {
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true, shouldDirty: true });
    }
    const currentCommissionAmount = (currentTotalAmount * agentDiscountRate) / 100;
    form.setValue('commissionAmount', currentCommissionAmount, { shouldValidate: true, shouldDirty: true });

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount, { shouldValidate: true, shouldDirty: true });
    
    const paidAmt = Number(currentFormData.paidAmount || 0);
    const actualSignedBalanceAmount = currentNetAmount - paidAmt;
    form.setValue('balanceAmount', Math.abs(actualSignedBalanceAmount), { shouldValidate: true, shouldDirty: true }); 

    console.log(`[CalcDebug] Final Amounts: TotalGuests=${currentTotalGuestsFromPackages}, Total=${currentTotalAmount}, CommissionPerc=${agentDiscountRate}%, CommissionAmt=${currentCommissionAmount}, Net=${currentNetAmount}, Paid=${paidAmt}, Balance=${Math.abs(actualSignedBalanceAmount)} (Signed: ${actualSignedBalanceAmount})`);

  }, [
    watchedPackageQuantities, 
    watchedAgentId, 
    watchedPaidAmount, 
    watchedYachtId, 
    allAgents, 
    allYachts, 
    form, 
    setCalculatedTotalGuests
  ]);


  // Effect to reset form when dialog opens or lead (for editing) changes
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
          packageQuantities: [], // Will be populated by the other effect based on selected yacht
          totalAmount: Number(lead.totalAmount || 0),
          commissionPercentage: Number(lead.commissionPercentage || 0), 
          commissionAmount: Number(lead.commissionAmount || 0),
          netAmount: Number(lead.netAmount || 0),
          paidAmount: Number(lead.paidAmount || 0),
          balanceAmount: Math.abs(Number(lead.balanceAmount || 0)), 
        };
        form.reset(resetValues);
        console.log('[LeadForm] Form reset for editing lead. Initial PQs empty, will be set by yacht effect.', JSON.parse(JSON.stringify(resetValues)));
      } else { 
        form.reset(defaultVals);
        replacePackageQuantities([]); // Clear package quantities for a new lead
        console.log('[LeadForm] Form reset for new lead.');
      }
      
      // Set initial commission percentage if agent is already selected (e.g., when editing)
      const currentAgentIdOnReset = form.getValues('agent');
      if (currentAgentIdOnReset && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === currentAgentIdOnReset);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0), { shouldValidate: true });
      } else if (!currentAgentIdOnReset && !lead) { // For new lead, default commission to 0
         form.setValue('commissionPercentage', 0, { shouldValidate: true });
      }
    }
  }, [lead, form, isOpen, allAgents, allYachts, replacePackageQuantities]); // Added allAgents, allYachts, replacePQs


  function onSubmit(data: LeadFormData) {
    // Recalculate financials one last time from form data to be absolutely sure
    let finalTotalAmount = 0;
    let finalTotalGuests = 0;
    const finalPackageQuantities: LeadPackageQuantity[] = [];

    const selectedYachtForSubmit = allYachts.find(y => y.id === data.yacht);

    if (selectedYachtForSubmit && selectedYachtForSubmit.packages && data.packageQuantities) {
      data.packageQuantities.forEach(pqItem => {
        const quantity = Number(pqItem.quantity || 0);
        // Look up rate from the selected yacht's packages at submission time
        const yachtPackage = selectedYachtForSubmit.packages?.find(p => p.id === pqItem.packageId);
        const rate = yachtPackage ? Number(yachtPackage.rate || 0) : Number(pqItem.rate || 0); // Fallback to pqItem.rate if yachtPackage not found

        if (quantity > 0 && rate > 0) {
          finalTotalAmount += quantity * rate;
        }
        finalTotalGuests += quantity;
        finalPackageQuantities.push({
            packageId: pqItem.packageId,
            packageName: pqItem.packageName,
            quantity: quantity,
            rate: rate // Store the rate used for calculation
        });
      });
    }
    
    const selectedAgentForSubmit = allAgents.find(a => a.id === data.agent);
    const finalCommissionPercentage = selectedAgentForSubmit ? Number(selectedAgentForSubmit.discount || 0) : 0;
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
                name="month" // This is the Lead/Event Date
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
                            form.setValue('yacht', ''); // Clear selected yacht when lead type changes
                            replacePackageQuantities([]); // Clear package quantities
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
                  <p className="text-sm text-muted-foreground mb-3">Enter quantities for packages offered by the selected yacht.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6 mt-2">
                    {packageQuantityFields.map((fieldItem, index) => {
                      const selectedYacht = allYachts.find(y => y.id === watchedYachtId);
                      const yachtPackage = selectedYacht?.packages?.find(p => p.id === fieldItem.packageId);
                      const rateForLabel = yachtPackage ? Number(yachtPackage.rate || 0) : 0;
                      
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

    