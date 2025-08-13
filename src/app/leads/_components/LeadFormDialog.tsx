
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
import { format, formatISO, parseISO, isValid, getYear } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';


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
  month: z.date({ required_error: "Booking/Event Date is required." }),
  notes: z.string().optional(),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.enum(leadTypeOptions, { required_error: "Booking type is required."}),
  paymentConfirmationStatus: z.enum(paymentConfirmationStatusOptions, { required_error: "Payment confirmation status is required."}),
  transactionId: z.string().optional(),
  bookingRefNo: z.string().optional(),
  modeOfPayment: z.enum(modeOfPaymentOptions),
  clientName: z.string().min(1, 'Client name is required'),

  packageQuantities: z.array(leadPackageQuantitySchema).optional().default([]),
  freeGuestCount: z.coerce.number().min(0, "Free guest count must be non-negative").optional().default(0),
  perTicketRate: z.coerce.number().min(0, "Other charges must be non-negative").optional().nullable(),

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
  isAdmin?: boolean; // Added for disabling form
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
    status: existingLead?.status || 'Balance', // Default to Balance for new leads
    month: existingLead?.month && isValid(parseISO(existingLead.month)) ? parseISO(existingLead.month) : new Date(),
    yacht: existingLead?.yacht || '',
    type: existingLead?.type || 'Private Cruise',
    paymentConfirmationStatus: existingLead?.paymentConfirmationStatus || 'UNCONFIRMED',
    modeOfPayment: existingLead?.modeOfPayment || 'CARD',
    clientName: existingLead?.clientName || '',
    notes: existingLead?.notes || '',
    transactionId: existingLead?.id ? (existingLead?.transactionId || 'Pending Generation') : 'Pending Generation',
    bookingRefNo: existingLead?.bookingRefNo || '',
    packageQuantities: initialPackageQuantities,
    freeGuestCount: Number(existingLead?.freeGuestCount || 0),
    perTicketRate: existingLead?.perTicketRate !== undefined && existingLead.perTicketRate !== null ? Number(Number(existingLead.perTicketRate).toFixed(2)) : null,
    totalAmount: Number(Number(existingLead?.totalAmount || 0).toFixed(2)),
    commissionPercentage: Number(existingLead?.commissionPercentage || 0),
    commissionAmount: Number(Number(existingLead?.commissionAmount || 0).toFixed(2)),
    netAmount: Number(Number(existingLead?.netAmount || 0).toFixed(2)),
    paidAmount: Number(Number(existingLead?.paidAmount || 0).toFixed(2)),
    balanceAmount: Number(Number(existingLead?.balanceAmount || 0).toFixed(2)),
    lastModifiedByUserId: existingLead?.lastModifiedByUserId || currentUserId || undefined,
    ownerUserId: existingLead?.ownerUserId || currentUserId || undefined,
    createdAt: existingLead?.createdAt || undefined,
    updatedAt: existingLead?.updatedAt || undefined,
  };
};


export function LeadFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess, currentUserId, isAdmin }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [calculatedTotalGuests, setCalculatedTotalGuests] = useState(0);
  const [cruiseScope, setCruiseScope] = useState<'private' | 'shared' | ''>('');

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
  const watchedPerTicketRate = form.watch('perTicketRate');
  const watchedStatus = form.watch('status');

  const isFormDisabled = useMemo(() => {
    // A form should be disabled if the status is 'Closed (Won)' or 'Closed (Lost)' and the user is not an admin.
    return (watchedStatus.startsWith('Closed') && !isAdmin);
  }, [watchedStatus, isAdmin]);


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

      } catch (error) {
        console.error("Error fetching dropdown data for Booking Form:", error);
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

  const filteredLeadTypeOptions = useMemo(() => {
    if (cruiseScope === 'private') {
      return leadTypeOptions.filter(opt => opt === 'Private Cruise');
    }
    if (cruiseScope === 'shared') {
      return leadTypeOptions.filter(opt => opt !== 'Private Cruise');
    }
    return [];
  }, [cruiseScope]);


  useEffect(() => {
    if (!isOpen || isLoadingDropdowns || !watchedYachtId) {
        if (!watchedYachtId && form.getValues('packageQuantities')?.length > 0) {
            replacePackageQuantities([]);
        }
        return;
    }

    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);

    // Check if the yacht selection has actually changed from the lead's original yacht
    const yachtChanged = lead?.yacht !== watchedYachtId;

    if (selectedYacht && selectedYacht.packages && Array.isArray(selectedYacht.packages)) {
      if (yachtChanged) {
        // Yacht has changed, so reset quantities to 0 and load new default rates
        const newPQs = selectedYacht.packages.map(yachtPkg => ({
          packageId: String(yachtPkg.id || `pkg-id-${Date.now()}-${Math.random()}`),
          packageName: String(yachtPkg.name || 'Unnamed Package'),
          quantity: 0,
          rate: Number(Number(yachtPkg.rate || 0).toFixed(2)),
        }));
        replacePackageQuantities(newPQs);
      } else {
        // Yacht is the same as the initial one (or form is loading for the first time with a lead)
        // Preserve existing quantities and rates from the lead data
        const currentPQs = form.getValues('packageQuantities') || [];
        const newPQs = selectedYacht.packages.map(yachtPkg => {
            const existingPQ = currentPQs.find(lpq => lpq.packageId === yachtPkg.id);
            return {
                packageId: String(yachtPkg.id),
                packageName: String(yachtPkg.name),
                quantity: existingPQ?.quantity || 0,
                // Always use the official rate from the yacht, not from existing data
                rate: Number(Number(yachtPkg.rate || 0).toFixed(2)),
            };
        });
        replacePackageQuantities(newPQs);
      }
    } else {
      replacePackageQuantities([]);
    }
    form.trigger(['packageQuantities']);
}, [isOpen, watchedYachtId, allYachts, replacePackageQuantities, lead, isLoadingDropdowns, form]);


  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith('packageQuantities') ||
        name === 'perTicketRate' ||
        name === 'agent' ||
        name === 'paidAmount'
      ) {
        const {
          packageQuantities = [],
          perTicketRate,
          agent: agentId,
          paidAmount,
        } = form.getValues();

        const selectedAgentForCalc = allAgents.find(a => a.id === agentId);
        const agentDiscountRate = selectedAgentForCalc ? Number(selectedAgentForCalc.discount || 0) : 0;

        let calculatedTotalAmount = 0;
        let tempTotalGuests = 0;

        packageQuantities.forEach(pqItem => {
          const quantity = Number(pqItem.quantity || 0);
          const rate = Number(pqItem.rate || 0);
          if (quantity > 0 && rate >= 0) {
            calculatedTotalAmount += quantity * rate;
          }
          tempTotalGuests += quantity;
        });

        if (perTicketRate && Number(perTicketRate) > 0) {
          calculatedTotalAmount += Number(perTicketRate);
        }

        calculatedTotalAmount = Number(calculatedTotalAmount.toFixed(2));
        setCalculatedTotalGuests(tempTotalGuests);

        const calculatedCommissionAmount = Number(
          ((calculatedTotalAmount * agentDiscountRate) / 100).toFixed(2)
        );
        const calculatedNetAmount = Number(
          (calculatedTotalAmount - calculatedCommissionAmount).toFixed(2)
        );
        const actualSignedBalanceAmount = Number(
          (calculatedNetAmount - (paidAmount || 0)).toFixed(2)
        );

        form.setValue('totalAmount', calculatedTotalAmount, { shouldValidate: true });
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true });
        form.setValue('commissionAmount', calculatedCommissionAmount, { shouldValidate: true });
        form.setValue('netAmount', calculatedNetAmount, { shouldValidate: true });
        form.setValue('balanceAmount', actualSignedBalanceAmount, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, allAgents]);


  useEffect(() => {
    if (isOpen) {
      const initialValues = getDefaultFormValues(lead, currentUserId);
      form.reset(initialValues);

      if (initialValues.type === 'Private Cruise') {
        setCruiseScope('private');
      } else if (initialValues.type) {
        setCruiseScope('shared');
      } else {
        setCruiseScope('');
      }

      if (initialValues.yacht && allYachts.length > 0) {
        const selectedYachtOnReset = allYachts.find(y => y.id === initialValues.yacht);
        if (selectedYachtOnReset?.packages) {
            const newPQs = selectedYachtOnReset.packages.map(yachtPkg => {
                const existingPQ = initialValues.packageQuantities?.find(lpq => lpq.packageId === yachtPkg.id);
                return {
                    packageId: yachtPkg.id,
                    packageName: yachtPkg.name,
                    quantity: existingPQ?.quantity || 0,
                    rate: Number(Number(yachtPkg.rate || 0).toFixed(2)),
                };
            });
            replacePackageQuantities(newPQs);
        } else {
            replacePackageQuantities([]);
        }
      } else {
        replacePackageQuantities([]);
      }

      const agentIdForCommission = lead?.agent || form.getValues('agent');
      if (agentIdForCommission && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === agentIdForCommission);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0));
      } else if (!agentIdForCommission) {
         form.setValue('commissionPercentage', 0);
      }
    }
  }, [lead, form, isOpen, allAgents, allYachts, currentUserId, replacePackageQuantities]);


  function onSubmit(data: LeadFormData) {
    if (isFormDisabled) {
        toast({ title: "Action Denied", description: "This booking is closed and cannot be modified by non-administrators.", variant: "destructive" });
        onOpenChange(false);
        return;
    }
    let rawFinalTotalAmount = 0;

    if (data.packageQuantities && Array.isArray(data.packageQuantities)) {
      data.packageQuantities.forEach(pqItem => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(Number(pqItem.rate || 0).toFixed(2));
        if (quantity > 0 && rate >= 0) {
          rawFinalTotalAmount += quantity * rate;
        }
      });
    }

    if (data.perTicketRate && Number(data.perTicketRate) > 0) {
        rawFinalTotalAmount += Number(data.perTicketRate);
    }

    const finalTotalAmount = Number(rawFinalTotalAmount.toFixed(2));

    const selectedAgentForSubmit = allAgents.find(a => a.id === data.agent);
    const finalCommissionPercentage = selectedAgentForSubmit ? Number(selectedAgentForSubmit.discount || 0) : 0;
    const finalCommissionAmount = Number(((finalTotalAmount * finalCommissionPercentage) / 100).toFixed(2));
    const finalNetAmount = Number((finalTotalAmount - finalCommissionAmount).toFixed(2));
    const finalPaidAmount = Number(Number(data.paidAmount || 0).toFixed(2));
    const actualSignedBalanceAmount = Number((finalNetAmount - finalPaidAmount).toFixed(2));

    const finalPackageQuantities = (data.packageQuantities && Array.isArray(data.packageQuantities))
      ? data.packageQuantities.map(pq => {
          return {
            packageId: String(pq.packageId),
            packageName: String(pq.packageName),
            quantity: Number(pq.quantity || 0),
            rate: Number(Number(pq.rate || 0).toFixed(2)),
          };
        })
      : [];

    const submittedLead: Lead = {
      ...data,
      id: lead?.id || `temp-${Date.now()}`,
      transactionId: lead?.id && data.transactionId === "Pending Generation" ? lead.transactionId : data.transactionId,
      bookingRefNo: data.bookingRefNo || undefined,
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      paymentConfirmationStatus: data.paymentConfirmationStatus,
      freeGuestCount: Number(data.freeGuestCount || 0),
      perTicketRate: data.perTicketRate !== undefined && data.perTicketRate !== null ? Number(Number(data.perTicketRate).toFixed(2)) : undefined,
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId || undefined,
      ownerUserId: lead?.ownerUserId || currentUserId || undefined,

      packageQuantities: finalPackageQuantities,
      totalAmount: finalTotalAmount,
      commissionPercentage: finalCommissionPercentage,
      commissionAmount: finalCommissionAmount,
      netAmount: finalNetAmount,
      paidAmount: finalPaidAmount,
      balanceAmount: actualSignedBalanceAmount,
      status: data.status,
    };
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
          <DialogHeader><DialogTitle>{lead ? 'Edit Booking' : 'Add New Booking'}</DialogTitle></DialogHeader>
          <div className="p-6 text-center">Loading form data...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{lead ? (isFormDisabled ? 'View Booking Details' : 'Edit Booking') : 'Add New Booking'}</DialogTitle>
          <DialogDescription>
            {lead ? (isFormDisabled ? 'This booking is closed and cannot be edited by non-administrators.' : 'Update the details for this booking.') : 'Fill in the details for the new booking.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
        {isFormDisabled && (
             <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Booking Closed</AlertTitle>
                <AlertDescription>
                    This booking is closed and cannot be edited by non-administrators.
                </AlertDescription>
            </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
           <fieldset disabled={isFormDisabled}>
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
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value} disabled={isFormDisabled && !isAdmin}>
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
                    <FormLabel>Booking/Event Date</FormLabel>
                     <DatePicker
                        date={field.value ? (isValid(field.value) ? field.value : new Date()) : new Date()}
                        setDate={(date) => {
                            if (date) {
                                field.onChange(date);
                            }
                        }}
                        placeholder="Pick booking date"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Cruise Scope</FormLabel>
                <Select
                    value={cruiseScope}
                    onValueChange={(value: 'private' | 'shared') => {
                        setCruiseScope(value);
                        form.setValue('type', '' as any);
                        form.setValue('yacht', '');
                        replacePackageQuantities([]);
                    }}
                    disabled={isFormDisabled}
                >
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select cruise scope" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="shared">Shared Cruise</SelectItem>
                        <SelectItem value="private">Private Cruise</SelectItem>
                    </SelectContent>
                </Select>
              </FormItem>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Type</FormLabel>
                     <Select
                        onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('yacht', '');
                            replacePackageQuantities([]);
                        }}
                        value={field.value || undefined}
                        defaultValue={field.value}
                        disabled={isFormDisabled || !cruiseScope}
                     >
                      <FormControl><SelectTrigger><SelectValue placeholder={!cruiseScope ? "Select Scope first" : "Select booking type"} /></SelectTrigger></FormControl>
                      <SelectContent>
                        {filteredLeadTypeOptions.map(typeOpt => (<SelectItem key={typeOpt} value={typeOpt}>{typeOpt}</SelectItem>))}
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
                      <FormControl><SelectTrigger><SelectValue placeholder={!watchedLeadType ? "Select Booking Type first" : (filteredYachts.length === 0 && !isLoadingDropdowns ? "No yachts for this type" : "Select a yacht")} /></SelectTrigger></FormControl>
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
                    <FormLabel>Payment/Conf. Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select payment status" /></SelectTrigger></FormControl>
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
                    <FormLabel>Transaction ID</FormLabel>
                    <FormControl><Input placeholder="Pending Generation" {...field} value={field.value || 'Pending Generation'} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingRefNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking REF No: (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., REF12345" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freeGuestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Guests/Items Count (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value || 0}
                        onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
                        min="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="perTicketRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Charges (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value === null || field.value === undefined ? '' : String(field.value)}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === '') {
                                field.onChange(null);
                            } else {
                                const numVal = parseFloat(val);
                                field.onChange(isNaN(numVal) ? null : numVal);
                            }
                        }}
                        step="0.01"
                        min="0"
                      />
                    </FormControl>
                     <FormDescription>Specify any other charges for this booking.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            {watchedYachtId && packageQuantityFields.length > 0 && (
              <div className="pt-4 border-t mt-6">
                <h3 className="text-lg font-medium mb-1">Package Item Quantities & Rates</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Enter quantities for the selected yacht. Rates are fixed and cannot be changed here.
                </p>
                <div className="space-y-4">
                  {packageQuantityFields.map((fieldItem, index) => (
                    <div key={fieldItem.id} className="p-3 border rounded-md">
                      <p className="font-medium mb-2">{fieldItem.packageName}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`packageQuantities.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="0" {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`packageQuantities.${index}.rate`}
                          render={({ field: rateField }) => (
                            <FormItem>
                              <FormLabel>Rate (AED)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  {...rateField}
                                  value={rateField.value ?? 0}
                                  readOnly
                                  className="bg-muted/50 cursor-not-allowed"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes or updates about this booking..."
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
                       <FormDescription>Calculated from packages & other charges</FormDescription>
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
                      <FormControl><Input type="number" placeholder="0" {...field} value={Number(field.value || 0)} readOnly className="bg-muted/50" /></FormControl>
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
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        />
                      </FormControl>
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
            </fieldset>
            <DialogFooter className="pt-6">
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingDropdowns || isFormDisabled}>
                {isLoadingDropdowns ? 'Loading...' : (lead ? (isFormDisabled ? 'Close' : 'Save Changes') : 'Add Booking')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
