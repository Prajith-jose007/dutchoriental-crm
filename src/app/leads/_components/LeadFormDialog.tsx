
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
import { PlusCircle, Trash2 } from 'lucide-react';

const leadPackageQuantitySchema = z.object({
  packageId: z.string(),
  packageName: z.string(),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative").default(0),
  rate: z.coerce.number().min(0).default(0),
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
  balanceAmount: z.coerce.number().default(0), // Will store absolute value for display
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

const getDefaultFormValues = (): LeadFormData => ({
    id: undefined,
    agent: '', status: 'Upcoming', month: new Date(), yacht: '',
    type: 'Private Cruise', modeOfPayment: 'Online', clientName: '',
    notes: '', transactionId: '',
    packageQuantities: [],
    totalAmount: 0, commissionPercentage: 0, commissionAmount:0, netAmount: 0,
    paidAmount: 0, balanceAmount: 0,
    lastModifiedByUserId: undefined,
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
        
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        console.log('[LeadForm] Fetched Agents:', agentsData);
        console.log('[LeadForm] Fetched Yachts:', yachtsData);

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
  const watchedLeadType = form.watch('type');
  const watchedPackageQuantities = form.watch('packageQuantities'); // Watch the entire array
  const watchedPaidAmount = form.watch('paidAmount');


  // Effect to update package quantities when yacht changes
  useEffect(() => {
    if (!watchedYachtId || allYachts.length === 0) {
      replacePackageQuantities([]);
      return;
    }
    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);
    console.log('[LeadForm] Yacht selected for packages:', selectedYacht);

    if (selectedYacht && selectedYacht.packages && selectedYacht.packages.length > 0) {
      const newPQs = selectedYacht.packages.map(pkg => {
        // Check if this package already exists in the form's current packageQuantities (e.g., when editing a lead)
        const existingPQInForm = form.getValues('packageQuantities')?.find(fpq => fpq.packageId === pkg.id);
        return {
          packageId: pkg.id,
          packageName: pkg.name,
          quantity: existingPQInForm?.quantity || 0, // Use existing quantity if available, else 0
          rate: Number(pkg.rate || 0),
        };
      });
      replacePackageQuantities(newPQs);
      console.log('[LeadForm] Populated packageQuantities based on selected yacht:', newPQs);
    } else {
      replacePackageQuantities([]);
       console.log('[LeadForm] Cleared packageQuantities as selected yacht has no packages.');
    }
  }, [watchedYachtId, allYachts, replacePackageQuantities, form]); // form added to dependency


  // Effect for financial calculations
  useEffect(() => {
    console.log('[CalcDebug] Financial calculation useEffect triggered.');
    const currentFormData = form.getValues();
    console.log('[CalcDebug] Current form data for calculation:', JSON.parse(JSON.stringify(currentFormData)));

    const selectedAgent = allAgents.find(a => a.id === currentFormData.agent);
    console.log('[CalcDebug] Selected Agent:', selectedAgent ? {id: selectedAgent.id, name: selectedAgent.name, discount: selectedAgent.discount} : null);
    
    const agentDiscountRate = Number(selectedAgent?.discount || 0);
    // Only set commissionPercentage if it's different or agent changed
    if (form.getValues('commissionPercentage') !== agentDiscountRate || currentFormData.agent !== form.watch('agent')) {
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true, shouldDirty: true });
        console.log('[CalcDebug] Agent Discount Rate Set in form:', agentDiscountRate);
    }

    let currentTotalAmount = 0;
    let currentTotalGuestsFromPackages = 0;

    if (currentFormData.packageQuantities && currentFormData.packageQuantities.length > 0) {
      console.log('[CalcDebug] Calculating from packageQuantities:', currentFormData.packageQuantities);
      currentFormData.packageQuantities.forEach((pqItem, index) => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(pqItem.rate || 0);
        console.log(`[CalcDebug] PackageItem ${index}: Name='${pqItem.packageName}', Qty=${quantity}, Rate=${rate}`);
        if (quantity > 0 && rate > 0) {
          currentTotalAmount += quantity * rate;
        }
        // Assuming all package quantities contribute to guest count. Adjust if some packages are non-guest items.
        currentTotalGuestsFromPackages += quantity;
      });
    } else {
      console.log('[CalcDebug] No packageQuantities to calculate from.');
    }
    
    setCalculatedTotalGuests(currentTotalGuestsFromPackages);
    console.log('[CalcDebug] Set Calculated Total Guests:', currentTotalGuestsFromPackages);

    form.setValue('totalAmount', currentTotalAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Set Total Amount from packageQuantities:', currentTotalAmount);

    const currentCommissionPercentage = form.getValues('commissionPercentage'); // Use the potentially updated value
    console.log('[CalcDebug] Using Commission Percentage for calc:', currentCommissionPercentage);
    const currentCommissionAmount = (currentTotalAmount * currentCommissionPercentage) / 100;
    form.setValue('commissionAmount', currentCommissionAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Set Commission Amount:', currentCommissionAmount);

    const currentNetAmount = currentTotalAmount - currentCommissionAmount;
    form.setValue('netAmount', currentNetAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Set Net Amount:', currentNetAmount);
    
    const paidAmt = Number(currentFormData.paidAmount || 0);
    const actualBalanceAmount = currentNetAmount - paidAmt; // This is the signed balance
    form.setValue('balanceAmount', Math.abs(actualBalanceAmount), { shouldValidate: true, shouldDirty: true }); 
    console.log('[CalcDebug] Paid Amount from form:', paidAmt);
    console.log('[CalcDebug] Raw Signed Balance Amount:', actualBalanceAmount);
    console.log('[CalcDebug] Set (Absolute) Balance Amount for display:', Math.abs(actualBalanceAmount));

  }, [
    watchedPackageQuantities, // This should effectively watch changes in the array items
    watchedAgentId, 
    watchedPaidAmount, 
    form, // form itself can be a dependency if getValues/setValue are used
    allAgents, // Needed to find selectedAgent
  ]);


  useEffect(() => {
    if (isOpen) {
      const defaultVals = getDefaultFormValues();
      if (lead) {
        const leadMonthDate = lead.month && isValid(parseISO(lead.month)) ? parseISO(lead.month) : defaultVals.month;
        
        // Prepare packageQuantities for the form, ensuring they match yacht's packages if yacht is set
        let leadSpecificPackageQuantities: LeadPackageQuantity[] = [];
        if (lead.yacht && allYachts.length > 0) {
            const selectedYachtOnLoad = allYachts.find(y => y.id === lead.yacht);
            if (selectedYachtOnLoad && selectedYachtOnLoad.packages) {
                leadSpecificPackageQuantities = selectedYachtOnLoad.packages.map(ypkg => {
                    const existingLeadPQ = lead.packageQuantities?.find(lpq => lpq.packageId === ypkg.id);
                    return {
                        packageId: ypkg.id,
                        packageName: ypkg.name,
                        quantity: existingLeadPQ?.quantity || 0,
                        rate: Number(ypkg.rate || 0),
                    };
                });
            }
        } else if (lead.packageQuantities) {
             // Fallback if yacht not found yet, but lead has PQs (e.g. if yachts haven't loaded)
            leadSpecificPackageQuantities = lead.packageQuantities.map(pq => ({
                ...pq,
                quantity: Number(pq.quantity || 0),
                rate: Number(pq.rate || 0)
            }));
        }


        const resetValues: LeadFormData = {
          ...defaultVals, 
          ...lead,        
          month: leadMonthDate, 
          transactionId: lead.transactionId || defaultVals.transactionId,
          notes: lead.notes || defaultVals.notes,
          packageQuantities: leadSpecificPackageQuantities, // Use intelligently prepared PQs
          totalAmount: lead.totalAmount || 0,
          commissionPercentage: lead.commissionPercentage || 0,
          commissionAmount: lead.commissionAmount || 0,
          netAmount: lead.netAmount || 0,
          paidAmount: lead.paidAmount || 0,
          balanceAmount: Math.abs(lead.balanceAmount || 0), 
        };
        form.reset(resetValues);
        console.log('[LeadForm] Form reset for editing lead:', JSON.parse(JSON.stringify(resetValues)));

      } else {
        form.reset(defaultVals);
        replacePackageQuantities([]); // Ensure packages are cleared for new lead
        console.log('[LeadForm] Form reset for new lead.');
      }
      
      const currentAgentIdOnReset = form.getValues('agent');
      if (currentAgentIdOnReset && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === currentAgentIdOnReset);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0), { shouldValidate: true, shouldDirty: true });
      } else if (!currentAgentIdOnReset && !lead) {
         form.setValue('commissionPercentage', 0, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [lead, form, isOpen, allAgents, allYachts, replacePackageQuantities]); // Added allYachts here


  function onSubmit(data: LeadFormData) {
    const currentUserId = 'DO-user1'; // Placeholder for actual logged-in user ID

    // Recalculate financials one last time based on submitted data to ensure accuracy
    let finalTotalAmount = 0;
    if (data.packageQuantities && data.packageQuantities.length > 0) {
      data.packageQuantities.forEach(pqItem => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(pqItem.rate || 0);
        if (quantity > 0 && rate > 0) {
          finalTotalAmount += quantity * rate;
        }
      });
    }
    
    const finalCommissionPercentage = data.commissionPercentage || 0;
    const finalCommissionAmount = (finalTotalAmount * finalCommissionPercentage) / 100;
    const finalNetAmount = finalTotalAmount - finalCommissionAmount;
    const finalPaidAmount = data.paidAmount || 0;
    const actualSignedBalanceAmount = finalNetAmount - finalPaidAmount;

    const submittedLead: Lead = {
      ...data,
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      id: lead?.id || data.id, // Use existing ID if editing, or ID from form if new (API generates if not provided)
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId,
      ownerUserId: lead?.ownerUserId || currentUserId,
      packageQuantities: data.packageQuantities?.map(pq => ({ // Ensure types are correct
        ...pq,
        quantity: Number(pq.quantity || 0),
        rate: Number(pq.rate || 0) 
      })) || [],
      totalAmount: finalTotalAmount,
      commissionPercentage: finalCommissionPercentage,
      commissionAmount: finalCommissionAmount,
      netAmount: finalNetAmount,
      paidAmount: finalPaidAmount,
      balanceAmount: actualSignedBalanceAmount, // Store the signed value
    };
    console.log("[LeadFormDialog] Submitting lead:", JSON.parse(JSON.stringify(submittedLead, null, 2)));
    onSubmitSuccess(submittedLead);
    onOpenChange(false);
  }

  const filteredYachts = useMemo(() => {
    if (!watchedLeadType || allYachts.length === 0) return allYachts;
    if (watchedLeadType === 'Private Cruise' || watchedLeadType === 'Dinner Cruise' || watchedLeadType === 'Superyacht Sightseeing Cruise') {
        const filtered = allYachts.filter(yacht => yacht.category === watchedLeadType);
        console.log(`[LeadForm] Filtered yachts for type "${watchedLeadType}":`, filtered);
        return filtered;
    }
    return allYachts; // Fallback if lead type is not one of the known categories
  }, [watchedLeadType, allYachts]);


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
                            form.setValue('yacht', ''); // Reset yacht selection when lead type changes
                            replacePackageQuantities([]); // Clear dynamic packages
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
                            // When yacht changes, repopulate packageQuantities based on the new yacht's packages
                            const selectedYacht = allYachts.find(y => y.id === value);
                            if (selectedYacht && selectedYacht.packages) {
                                const newPQs = selectedYacht.packages.map(pkg => ({
                                    packageId: pkg.id,
                                    packageName: pkg.name,
                                    quantity: 0, // Default new quantities to 0
                                    rate: Number(pkg.rate || 0),
                                }));
                                replacePackageQuantities(newPQs);
                            } else {
                                replacePackageQuantities([]);
                            }
                        }} 
                        value={field.value || undefined} 
                        defaultValue={field.value} 
                        disabled={!watchedLeadType}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder={!watchedLeadType ? "Select Lead Type first" : "Select a yacht"} /></SelectTrigger></FormControl>
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
              <div>
                  <h3 className="text-lg font-medium pt-4 border-t mt-6 mb-2">Package Item Quantities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    {packageQuantityFields.map((fieldItem, index) => (
                      <FormField
                        key={fieldItem.id} // This is the id from useFieldArray
                        control={form.control}
                        name={`packageQuantities.${index}.quantity`}
                        render={({ field: qtyField }) => {
                          // Get the corresponding package details (name, rate) from the form's packageQuantities array
                          const currentPackage = form.getValues(`packageQuantities.${index}`);
                          const rateDisplay = currentPackage?.rate !== undefined ? `(Rate: ${currentPackage.rate} AED)` : '(Rate N/A)';
                          return (
                            <FormItem>
                              <FormLabel>{currentPackage?.packageName || 'Package'} {rateDisplay}</FormLabel>
                              <FormControl>
                                  <Input type="number" min="0" placeholder="0" {...qtyField} onChange={e => qtyField.onChange(parseInt(e.target.value,10) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
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

    