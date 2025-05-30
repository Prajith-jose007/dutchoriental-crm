
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
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, yachtCategoryOptions } from '@/lib/types';
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
  month: z.date({ required_error: "Lead/Event Date is required." }),
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
  const watchedPackageQuantities = form.watch('packageQuantities');
  const watchedPaidAmount = form.watch('paidAmount');


  // Effect to update package quantities when yacht changes
  useEffect(() => {
    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);
    if (selectedYacht && selectedYacht.packages && selectedYacht.packages.length > 0) {
      const newPQs = selectedYacht.packages.map(pkg => {
        const existingPQ = lead?.packageQuantities?.find(pq => pq.packageId === pkg.id);
        return {
          packageId: pkg.id,
          packageName: pkg.name,
          quantity: existingPQ?.quantity || 0,
          rate: pkg.rate,
        };
      });
      replacePackageQuantities(newPQs);
    } else {
      replacePackageQuantities([]); // Clear package quantities if no yacht or no packages
    }
  }, [watchedYachtId, allYachts, lead?.packageQuantities, replacePackageQuantities]);


  // Effect for financial calculations
  useEffect(() => {
    console.log('[CalcDebug] Financial calculation useEffect triggered.');
    const currentFormData = form.getValues();
    const selectedAgent = allAgents.find(a => a.id === currentFormData.agent);
    
    console.log('[CalcDebug] Selected Agent:', selectedAgent ? {id: selectedAgent.id, name: selectedAgent.name, discount: selectedAgent.discount} : null);
    
    const agentDiscountRate = Number(selectedAgent?.discount || 0);
    if (form.getValues('commissionPercentage') !== agentDiscountRate) {
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true, shouldDirty: true });
        console.log('[CalcDebug] Agent Discount Rate Set in form:', agentDiscountRate);
    }

    let currentTotalAmount = 0;
    let currentTotalGuestsFromPackages = 0;

    if (currentFormData.packageQuantities && currentFormData.packageQuantities.length > 0) {
      currentFormData.packageQuantities.forEach((pqItem, index) => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(pqItem.rate || 0); // Rate is stored with the PQ item from yacht
        console.log(`[CalcDebug] PackageItem ${index}: Name='${pqItem.packageName}', Qty=${quantity}, Rate=${rate}`);
        if (quantity > 0 && rate > 0) {
          currentTotalAmount += quantity * rate;
        }
        currentTotalGuestsFromPackages += quantity;
      });
    }
    setCalculatedTotalGuests(currentTotalGuestsFromPackages);

    form.setValue('totalAmount', currentTotalAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Set Total Amount from packageQuantities:', currentTotalAmount);

    const currentCommissionPercentage = form.getValues('commissionPercentage');
    const currentCommissionAmount = (currentTotalAmount * currentCommissionPercentage) / 100;
    form.setValue('commissionAmount', currentCommissionAmount, { shouldValidate: true, shouldDirty: true });
    console.log('[CalcDebug] Using Commission Percentage:', currentCommissionPercentage, 'Set Commission Amount:', currentCommissionAmount);

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
    watchedAgentId, watchedYachtId, watchedPackageQuantities, watchedPaidAmount, 
    form, allAgents, allYachts
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
          packageQuantities: lead.packageQuantities?.map(pq => ({...pq, quantity: Number(pq.quantity || 0), rate: Number(pq.rate || 0)})) || [],
          totalAmount: lead.totalAmount || 0,
          commissionPercentage: lead.commissionPercentage || 0,
          commissionAmount: lead.commissionAmount || 0,
          netAmount: lead.netAmount || 0,
          paidAmount: lead.paidAmount || 0,
          balanceAmount: Math.abs(lead.balanceAmount || 0), 
        };
        form.reset(resetValues);
         // Trigger package repopulation if yacht is already set
        if (lead.yacht && allYachts.length > 0) {
            const selectedYachtOnLoad = allYachts.find(y => y.id === lead.yacht);
            if (selectedYachtOnLoad && selectedYachtOnLoad.packages) {
                 const newPQs = selectedYachtOnLoad.packages.map(pkg => {
                    const existingPQ = lead.packageQuantities?.find(pq => pq.packageId === pkg.id);
                    return {
                        packageId: pkg.id,
                        packageName: pkg.name,
                        quantity: existingPQ?.quantity || 0,
                        rate: pkg.rate,
                    };
                });
                replacePackageQuantities(newPQs);
            } else {
                 replacePackageQuantities([]);
            }
        }


      } else {
        form.reset(defaultVals);
        replacePackageQuantities([]); // Ensure packages are cleared for new lead
      }
      
      const currentAgentIdOnReset = form.getValues('agent');
      if (currentAgentIdOnReset && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === currentAgentIdOnReset);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0), { shouldValidate: true, shouldDirty: true });
      } else if (!currentAgentIdOnReset && !lead) {
         form.setValue('commissionPercentage', 0, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [lead, form, isOpen, allAgents, allYachts, replacePackageQuantities]);


  function onSubmit(data: LeadFormData) {
    const currentUserId = 'DO-user1'; 

    const finalTotalAmount = data.totalAmount || 0;
    const finalCommissionPercentage = data.commissionPercentage || 0;
    const finalCommissionAmount = (finalTotalAmount * finalCommissionPercentage) / 100;
    const finalNetAmount = finalTotalAmount - finalCommissionAmount;
    const finalPaidAmount = data.paidAmount || 0;
    // Submit the actual signed balance amount
    const actualSignedBalanceAmount = finalNetAmount - finalPaidAmount;

    const submittedLead: Lead = {
      ...data,
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      id: lead?.id || data.id, 
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId,
      ownerUserId: lead?.ownerUserId || currentUserId,
      packageQuantities: data.packageQuantities?.map(pq => ({
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
    console.log("[LeadFormDialog] Submitting lead:", JSON.stringify(submittedLead, null, 2));
    onSubmitSuccess(submittedLead);
    onOpenChange(false);
  }

  const filteredYachts = useMemo(() => {
    if (!watchedLeadType || watchedLeadType === 'all' as any) return allYachts; // 'all' is not a valid LeadType
    return allYachts.filter(yacht => yacht.category === watchedLeadType);
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
                            form.setValue('yacht', ''); // Reset yacht selection
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
                            // When yacht changes, repopulate packageQuantities
                            const selectedYacht = allYachts.find(y => y.id === value);
                            if (selectedYacht && selectedYacht.packages) {
                                const newPQs = selectedYacht.packages.map(pkg => ({
                                    packageId: pkg.id,
                                    packageName: pkg.name,
                                    quantity: 0, // Default new quantities to 0
                                    rate: pkg.rate,
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
