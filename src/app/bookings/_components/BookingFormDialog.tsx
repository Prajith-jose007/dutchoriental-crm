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
import { ActivityLog } from './ActivityLog';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { Lead, Agent, Yacht, ModeOfPayment, LeadStatus, LeadType, YachtPackageItem, LeadPackageQuantity, PaymentConfirmationStatus, User } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, yachtCategoryOptions, paymentConfirmationStatusOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import { format, formatISO, parseISO, isValid, getYear } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, XCircle, Wallet, Percent } from 'lucide-react';

import { cn } from '@/lib/utils';


const bookingPackageQuantitySchema = z.object({
  packageId: z.string().min(1, "Package ID is required"),
  packageName: z.string().min(1, "Package name is required"),
  quantity: z.coerce.number().min(0, "Quantity must be non-negative").default(0),
  rate: z.coerce.number().min(0, "Rate must be non-negative").default(0),
});

const leadFormSchema = z.object({
  id: z.string().optional(),
  agent: z.string().optional(),
  customAgentName: z.string().optional(),
  customAgentPhone: z.string().optional(),
  status: z.enum(leadStatusOptions),
  month: z.date({ required_error: "Booking/Event Date is required." }),
  notes: z.string().optional(),
  freeGuestDetails: z.array(z.object({
    type: z.string(),
    quantity: z.number().min(0)
  })).optional(),
  yacht: z.string().min(1, 'Yacht selection is required'),
  type: z.enum(leadTypeOptions, { required_error: "Booking type is required." }),
  paymentConfirmationStatus: z.enum(paymentConfirmationStatusOptions, { required_error: "Payment confirmation status is required." }),
  transactionId: z.string().optional(),
  bookingRefNo: z.string().optional(),
  modeOfPayment: z.enum(modeOfPaymentOptions),
  clientName: z.string().min(1, 'Client name is required'),

  // CRM specific fields
  customerPhone: z.string().optional(),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  nationality: z.string().optional(),
  language: z.string().optional(),
  source: z.string().optional(),
  inquiryDate: z.date().optional().nullable(),
  yachtType: z.string().optional(),
  adultsCount: z.coerce.number().min(0).optional().default(0),
  kidsCount: z.coerce.number().min(0).optional().default(0),
  durationHours: z.coerce.number().min(0).optional().default(0),
  budgetRange: z.string().optional(),
  occasion: z.string().optional(),
  priority: z.string().optional(),
  nextFollowUpDate: z.date().optional().nullable(),
  closingProbability: z.coerce.number().min(0).max(100).optional().default(0),

  // Operations
  captainName: z.string().optional(),
  crewDetails: z.string().optional(),
  idVerified: z.boolean().optional().default(false),
  extraHoursUsed: z.coerce.number().min(0).optional().default(0),
  extraCharges: z.coerce.number().min(0).optional().default(0),

  packageQuantities: z.array(bookingPackageQuantitySchema).optional().default([]),
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

export type BookingFormData = z.infer<typeof leadFormSchema>;

interface BookingFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  onSubmitSuccess: (data: Lead) => void;
  currentUserId?: string | null;
  isAdmin?: boolean;
  allUsers?: User[];
}

const getDefaultFormValues = (existingLead?: Lead | null, currentUserId?: string | null): BookingFormData => {
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
    customAgentName: existingLead?.customAgentName || '',
    customAgentPhone: existingLead?.customAgentPhone || '',
    status: existingLead?.status || 'Balance', // Default to Balance for new leads
    month: existingLead?.month && isValid(parseISO(existingLead.month)) ? parseISO(existingLead.month) : new Date(),
    yacht: existingLead?.yacht || '',
    type: existingLead?.type || (undefined as any), // Force selection
    paymentConfirmationStatus: existingLead?.paymentConfirmationStatus || 'UNCONFIRMED',
    modeOfPayment: existingLead?.modeOfPayment || 'CARD',
    clientName: existingLead?.clientName || '',
    notes: existingLead?.notes || '',
    transactionId: existingLead?.id ? (existingLead?.transactionId || 'Pending Generation') : 'Pending Generation',
    bookingRefNo: existingLead?.bookingRefNo || '',

    // CRM fields
    customerPhone: existingLead?.customerPhone || '',
    customerEmail: existingLead?.customerEmail || '',
    nationality: existingLead?.nationality || '',
    language: existingLead?.language || '',
    source: existingLead?.source || '',
    inquiryDate: existingLead?.inquiryDate ? parseISO(existingLead.inquiryDate) : null,
    yachtType: existingLead?.yachtType || '',
    adultsCount: Number(existingLead?.adultsCount || 0),
    kidsCount: Number(existingLead?.kidsCount || 0),
    durationHours: Number(existingLead?.durationHours || 2),
    budgetRange: existingLead?.budgetRange || '',
    occasion: existingLead?.occasion || '',
    priority: existingLead?.priority || 'Medium',
    nextFollowUpDate: existingLead?.nextFollowUpDate ? parseISO(existingLead.nextFollowUpDate) : null,
    closingProbability: Number(existingLead?.closingProbability || 0),

    // Operations
    captainName: existingLead?.captainName || '',
    crewDetails: existingLead?.crewDetails || '',
    idVerified: !!existingLead?.idVerified,
    extraHoursUsed: Number(existingLead?.extraHoursUsed || 0),
    extraCharges: Number(existingLead?.extraCharges || 0),

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
    freeGuestDetails: existingLead?.freeGuestDetails || [],
  };
};


export function BookingFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess, currentUserId, isAdmin, allUsers: propAllUsers }: BookingFormDialogProps) {
  const { toast } = useToast();
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>(propAllUsers || []);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);
  const [calculatedTotalGuests, setCalculatedTotalGuests] = useState(0);
  const [cruiseScope, setCruiseScope] = useState<'private' | 'shared' | ''>('');

  const form = useForm<BookingFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: getDefaultFormValues(lead, currentUserId),
  });

  const { fields: packageQuantityFields, replace: replacePackageQuantities } = useFieldArray({
    control: form.control,
    name: "packageQuantities",
  });

  const { fields: freeGuestFields, append: appendFreeGuest, remove: removeFreeGuest } = useFieldArray({
    control: form.control,
    name: "freeGuestDetails" as any, // Cast to any if necessary due to schema timing
  });

  const watchedLeadType = form.watch('type');
  const watchedYachtId = form.watch('yacht');
  const watchedAgentId = form.watch('agent');
  const watchedPaidAmount = form.watch('paidAmount');
  const watchedPackageQuantities = form.watch('packageQuantities');
  const watchedPerTicketRate = form.watch('perTicketRate');
  const watchedStatus = form.watch('status');

  const isFormDisabled = useMemo(() => {
    // A form should be disabled if the status is 'Closed (Won)', 'Closed (Lost)', or 'Completed' and the user is not an admin.
    return ((watchedStatus.startsWith('Closed') || watchedStatus === 'Completed') && !isAdmin);
  }, [watchedStatus, isAdmin]);


  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoadingDropdowns(true);
      try {
        const [agentsRes, yachtsRes, usersRes] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/yachts'),
          fetch('/api/users'),
        ]);
        if (!agentsRes.ok) throw new Error('Failed to fetch agents for form');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts for form');
        if (!usersRes.ok) throw new Error('Failed to fetch users for form');

        const agentsData = await agentsRes.json();
        const yachtsData = await yachtsRes.json();
        const usersData = await usersRes.json();

        setAllAgents(Array.isArray(agentsData) ? agentsData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAllUsers(Array.isArray(usersData) ? usersData : []);

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
        name === 'paidAmount' ||
        name === 'durationHours' ||
        name === 'yacht' ||
        name === 'type' ||
        name === 'commissionPercentage' ||
        name === 'freeGuestCount'
      ) {
        const {
          packageQuantities = [],
          perTicketRate,
          agent: agentId,
          paidAmount,
          durationHours,
          yacht: yachtId,
          type: leadType,
          freeGuestCount
        } = form.getValues();

        const selectedYacht = allYachts.find(y => y.id === yachtId);

        // Logic: Use current form value for discount, unless Agent just changed
        let agentDiscountRate = Number(form.getValues('commissionPercentage') || 0);
        if (name === 'agent') {
          const selectedAgentForCalc = allAgents.find(a => a.id === agentId);
          agentDiscountRate = selectedAgentForCalc ? Number(selectedAgentForCalc.discount || 0) : 0;
          form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true });
        }

        let calculatedTotalAmount = 0;
        let tempTotalGuests = 0;

        const calculationDetails: any[] = [];

        // Add Yacht Base price if Private Cruise
        if (leadType === 'Private Cruise' && selectedYacht) {
          const yachtRate = Number(selectedYacht.pricePerHour || 0);
          const hours = Number(durationHours || 0);
          const yachtTotal = yachtRate * hours;
          if (yachtTotal > 0) {
            calculatedTotalAmount += yachtTotal;
            calculationDetails.push({ pkg: `Yacht: ${selectedYacht.name}`, qty: hours, rate: yachtRate, subtotal: yachtTotal });
          }
        }

        packageQuantities.forEach(pqItem => {
          const quantity = Number(pqItem.quantity || 0);
          const rate = Number(pqItem.rate || 0);
          if (quantity > 0 && rate >= 0) {
            calculatedTotalAmount += quantity * rate;
            calculationDetails.push({ pkg: pqItem.packageName, qty: quantity, rate, subtotal: quantity * rate });
          }
          tempTotalGuests += quantity;
        });

        // Add Free Guests to Total Guest Count
        tempTotalGuests += Number(freeGuestCount || 0);


        if (perTicketRate && Number(perTicketRate) > 0) {
          // User requested that 'Other Charges' should NOT be included in the Total Amount calculation.
          // calculatedTotalAmount += Number(perTicketRate); 
          calculationDetails.push({ pkg: 'Other Charges (Excluded)', qty: 1, rate: Number(perTicketRate) });
        }

        console.log("[BookingForm] Calculation Update:", {
          total: calculatedTotalAmount,
          details: calculationDetails
        });

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
        // Discount % is manually editable, so we don't overwrite it here unless agent changed (handled above)
        form.setValue('commissionAmount', calculatedCommissionAmount, { shouldValidate: true });
        form.setValue('netAmount', calculatedNetAmount, { shouldValidate: true });
        form.setValue('balanceAmount', actualSignedBalanceAmount, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, allAgents, allYachts]);


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


  function onSubmit(data: BookingFormData) {
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

    // if (data.perTicketRate && Number(data.perTicketRate) > 0) {
    //   rawFinalTotalAmount += Number(data.perTicketRate);
    // }

    const finalTotalAmount = Number(rawFinalTotalAmount.toFixed(2));

    // Use the form's commission percentage (which allows manual override), fallback to agent default only if missing
    const finalCommissionPercentage = Number(data.commissionPercentage);
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

    const { agent: formAgent, ...restOfFormData } = data;
    const submittedLead: Lead = {
      ...restOfFormData,
      agent: formAgent || data.customAgentName || '',
      id: lead?.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      transactionId: lead?.id && data.transactionId === "Pending Generation" ? lead.transactionId : (data.transactionId === "Pending Generation" ? undefined : data.transactionId),
      bookingRefNo: data.bookingRefNo || undefined,
      month: data.month ? formatISO(data.month) : formatISO(new Date()),
      inquiryDate: data.inquiryDate ? formatISO(data.inquiryDate) : undefined,
      nextFollowUpDate: data.nextFollowUpDate ? formatISO(data.nextFollowUpDate) : undefined,
      paymentConfirmationStatus: data.paymentConfirmationStatus,
      freeGuestCount: Number(data.freeGuestCount || 0),
      perTicketRate: data.perTicketRate !== undefined && data.perTicketRate !== null ? Number(Number(data.perTicketRate).toFixed(2)) : undefined,
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId || undefined,
      ownerUserId: lead?.ownerUserId || currentUserId || undefined,
      customAgentName: data.customAgentName,
      customAgentPhone: data.customAgentPhone,

      packageQuantities: finalPackageQuantities,
      totalAmount: finalTotalAmount,
      commissionPercentage: finalCommissionPercentage,
      commissionAmount: finalCommissionAmount,
      netAmount: finalNetAmount,
      paidAmount: finalPaidAmount,
      balanceAmount: actualSignedBalanceAmount,
      status: data.status,
      freeGuestDetails: (data.freeGuestDetails || []) as any,

      // Ensure union types are properly cast from form data
      source: data.source as any,
      yachtType: data.yachtType as any,
      occasion: data.occasion as any,
      priority: data.priority as any,
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <fieldset disabled={isFormDisabled}>
                <div className="space-y-6 pr-2">

                  {/* --- ROW 1: BASICS --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Client Name */}
                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name</FormLabel>
                          <FormControl><Input placeholder="Client Name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Agent */}
                    <FormField
                      control={form.control}
                      name="agent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agent</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Agent" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {allAgents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {leadStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Booking Type (Merging Scope & Type) */}
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Type</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              if (val === 'Private Cruise') setCruiseScope('private');
                              else setCruiseScope('shared');
                              form.setValue('yacht', '');
                              replacePackageQuantities([]);
                            }}
                            value={field.value || undefined}
                          >
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {leadTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Booking Date */}
                    <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Booking Date</FormLabel>
                          <DatePicker
                            date={field.value ? (isValid(field.value) ? field.value : new Date()) : new Date()}
                            setDate={(date) => { if (date) field.onChange(date); }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* --- ROW 2: CRUISE DETAILS (Conditional) --- */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    {/* Yacht Name */}
                    <FormField
                      control={form.control}
                      name="yacht"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yacht Name</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            disabled={!cruiseScope}
                          >
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Yacht" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {filteredYachts.map((yacht) => (<SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Ticket No / Ref */}
                    <FormField
                      control={form.control}
                      name="bookingRefNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket Number / Ref</FormLabel>
                          <FormControl><Input placeholder="Ticket No" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Free Guest Count */}
                    <FormField
                      control={form.control}
                      name="freeGuestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Guest (Child 0-3 yrs)</FormLabel>
                          <FormControl><Input type="number" min="0" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* --- PACKAGES GRID --- */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Packages (As per Boat)</label>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">Total Guests: {calculatedTotalGuests}</span>
                    </div>

                    {packageQuantityFields.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground border border-dashed rounded-md text-sm">Select a Yacht to view packages</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {packageQuantityFields.map((fieldItem, index) => (
                          <div key={fieldItem.id} className="bg-muted/20 p-3 rounded-lg border hover:border-primary/50 transition-colors">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block truncate" title={fieldItem.packageName}>
                              {fieldItem.packageName}
                            </label>
                            <div className="flex gap-2 items-center mb-1">
                              <span className="text-[10px] text-muted-foreground">AED {form.watch(`packageQuantities.${index}.rate`)}</span>
                            </div>
                            <FormField
                              control={form.control}
                              name={`packageQuantities.${index}.quantity`}
                              render={({ field }) => (
                                <FormControl>
                                  <div className="relative">
                                    <Input type="number" min="0" className="h-9 text-center font-bold bg-white" placeholder="0" {...field} />
                                    <span className="absolute right-2 top-2.5 text-[10px] text-muted-foreground">Qty</span>
                                  </div>
                                </FormControl>
                              )}
                            />
                            {/* Hidden Rate Field */}
                            <div className="hidden">
                              <FormField
                                control={form.control}
                                name={`packageQuantities.${index}.rate`}
                                render={({ field }) => <Input {...field} />}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- OTHER PACKAGE / ADJUSTMENT --- */}
                  <FormField
                    control={form.control}
                    name="perTicketRate"
                    render={({ field }) => (
                      <FormItem className="md:w-1/3">
                        <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Other Package Amount (Excluded from Total)</FormLabel>
                        <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value === null ? '' : field.value} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* --- FINANCIALS --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border p-6 rounded-xl mt-6 bg-slate-50/80">
                    {/* Total Amount */}
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" /> Total Amount (AED)
                          </FormLabel>
                          <FormControl><Input readOnly className="bg-slate-100 font-bold" {...field} value={field.value?.toLocaleString() || '0'} /></FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Net Amount */}
                    <FormField
                      control={form.control}
                      name="netAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" /> Net Amount
                          </FormLabel>
                          <FormControl><Input readOnly className="bg-slate-100 font-bold" {...field} value={field.value?.toLocaleString() || '0'} /></FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Other Amount (Display Only or redundant? User asked for d. Other Amount. 
                             If it's excluding from calculation, maybe just showing input above is enough.
                             But let's show it here if needed, or simply skip since it is above.)
                             User: "c. other amount". Let's assume input above satisfies this.
                         */}

                    {/* Discount % */}
                    <FormField
                      control={form.control}
                      name="commissionPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-muted-foreground" /> Discount (%) (Agent)
                          </FormLabel>
                          <FormControl><Input type="number" step="0.5" className="bg-white" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Commission Amount (Hidden req? User said "d. discount as per agent". Maybe amount?) */}
                    <FormField
                      control={form.control}
                      name="commissionAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" /> Discount Amt
                          </FormLabel>
                          <FormControl><Input readOnly className="bg-slate-100/50 text-xs" {...field} value={field.value?.toLocaleString() || '0'} /></FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Paid Amount */}
                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-700 font-bold flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Paid Amount
                          </FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="border-green-200 bg-green-50 text-green-800 font-bold" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Mode of Payment */}
                    <FormField
                      control={form.control}
                      name="modeOfPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-muted-foreground" /> Payment Mode
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {modeOfPaymentOptions.map(mop => (<SelectItem key={mop} value={mop}>{mop}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Balance Amount */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" /> Balance Due
                      </label>
                      <div className="flex h-10 w-full rounded-md border border-input bg-slate-900 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white font-black">
                        AED {form.watch('balanceAmount')?.toLocaleString() || '0.00'}
                      </div>
                    </div>
                  </div>

                  {/* --- NOTES --- */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking Notes</FormLabel>
                        <FormControl><Textarea placeholder="Add any notes..." className="h-20" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <DialogFooter className="pt-4 border-t gap-2 mt-4">
                  <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                  <Button type="submit" className="px-8 shadow-lg shadow-primary/20" disabled={isFormDisabled}>
                    {lead?.id ? (isFormDisabled ? 'View Only' : 'Save Changes') : 'Create Booking'}
                  </Button>
                </DialogFooter>
              </fieldset>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog >
  );
}
