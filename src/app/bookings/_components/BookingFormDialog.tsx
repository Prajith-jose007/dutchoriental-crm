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
import { Terminal, XCircle } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
    type: existingLead?.type || 'Private Cruise',
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
        name === 'type'
      ) {
        const {
          packageQuantities = [],
          perTicketRate,
          agent: agentId,
          paidAmount,
          durationHours,
          yacht: yachtId,
          type: leadType
        } = form.getValues();

        const selectedYacht = allYachts.find(y => y.id === yachtId);
        const selectedAgentForCalc = allAgents.find(a => a.id === agentId);
        const agentDiscountRate = selectedAgentForCalc ? Number(selectedAgentForCalc.discount || 0) : 0;

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
        form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true });
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
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="client">Client Details</TabsTrigger>
                    <TabsTrigger value="sales">Sales Info</TabsTrigger>
                    <TabsTrigger value="packages">Packages/Costs</TabsTrigger>
                    <TabsTrigger value="ops">Operations</TabsTrigger>
                    <TabsTrigger value="activities">Interactions</TabsTrigger>
                  </TabsList>

                  <ScrollArea className="h-[60vh] mt-4 pr-4">
                    {/* --- BASIC INFO TAB --- */}
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="month"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Booking/Event Date</FormLabel>
                              <DatePicker
                                date={field.value ? (isValid(field.value) ? field.value : new Date()) : new Date()}
                                setDate={(date) => { if (date) field.onChange(date); }}
                                placeholder="Pick booking date"
                              />
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
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {leadStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                                </SelectContent>
                              </Select>
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
                          >
                            <FormControl><SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger></FormControl>
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
                                onValueChange={(value) => { field.onChange(value); form.setValue('yacht', ''); replacePackageQuantities([]); }}
                                value={field.value || undefined}
                                disabled={!cruiseScope}
                              >
                                <FormControl><SelectTrigger><SelectValue placeholder={!cruiseScope ? "Select Cruise Scope first" : "Select type"} /></SelectTrigger></FormControl>
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
                                onValueChange={field.onChange}
                                value={field.value || undefined}
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
                        {cruiseScope === 'shared' ? (
                          <FormField
                            control={form.control}
                            name="agent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Partner/Agent</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || undefined}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Select an agent" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                    {allAgents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : (
                          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="customAgentName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>External Agent Name</FormLabel>
                                  <FormControl><Input placeholder="e.g. Luxury Travels" {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="customAgentPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>External Agent Phone</FormLabel>
                                  <FormControl><Input placeholder="+971..." {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Booking Remarks / Internal Notes</FormLabel>
                            <FormControl><Textarea placeholder="Add any specific details or special requests..." className="h-20" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>

                    {/* --- CLIENT DETAILS TAB --- */}
                    <TabsContent value="client" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="clientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name / Company Name</FormLabel>
                              <FormControl><Input placeholder="e.g., John Doe / Acme Corp" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Number (WhatsApp)</FormLabel>
                              <FormControl><Input placeholder="+971..." {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nationality</FormLabel>
                              <FormControl><Input placeholder="e.g., British" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Language</FormLabel>
                              <FormControl><Input placeholder="e.g., English / Arabic" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* --- SALES INFO TAB --- */}
                    <TabsContent value="sales" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="source"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lead Source</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {['Website', 'WhatsApp', 'Instagram', 'Walk-in', 'Partner', 'Agent'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {['Low', 'Medium', 'High'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="yachtType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Yacht Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Yacht Type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {['Luxury', 'Mega Yacht', 'Catamaran', 'Speedboat'].map(yt => <SelectItem key={yt} value={yt}>{yt}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="closingProbability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Closing Probability (%)</FormLabel>
                              <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="inquiryDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Inquiry Date</FormLabel>
                              <DatePicker
                                date={field.value || undefined}
                                setDate={(date) => field.onChange(date)}
                                placeholder="Pick inquiry date"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ownerUserId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned To (Owner)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value || undefined}
                                disabled={!isAdmin} // Only Admins/Heads can assign to others
                              >
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Owner" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {allUsers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-[10px]">
                                {isAdmin ? "Re-assign this lead to a team member." : "Lead ownership can only be changed by admins."}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="nextFollowUpDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Next Follow-up</FormLabel>
                              <DatePicker
                                date={field.value || undefined}
                                setDate={(date) => field.onChange(date)}
                                placeholder="Pick follow-up date"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Separator className="my-2" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="adultsCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adults</FormLabel>
                              <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="kidsCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Kids / Children</FormLabel>
                              <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="durationHours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration (Hours)</FormLabel>
                              <FormControl><Input type="number" step="0.5" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="occasion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Occasion</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select occasion" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {['Birthday', 'Anniversary', 'Corporate', 'Proposal', 'Party', 'Other'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="budgetRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget Range (AED)</FormLabel>
                              <FormControl><Input placeholder="e.g. 5,000 - 10,000" {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    {/* --- PACKAGES TAB --- */}
                    <TabsContent value="packages" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="modeOfPayment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mode of Payment</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger></FormControl>
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
                              <FormLabel>Payment Status</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
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
                          name="bookingRefNo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Internal REF No.</FormLabel>
                              <FormControl><Input placeholder="REF..." {...field} value={field.value || ''} /></FormControl>
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
                      </div>

                      <div className="border p-4 rounded-md mt-4 space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-sm font-medium">Free Guests / Complimentary Items</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              appendFreeGuest({ type: 'Child (0-3 years)', quantity: 0 });
                            }}
                          >
                            + Add Free Guest
                          </Button>
                        </div>
                        {freeGuestFields.map((item, index) => (
                          <div key={item.id} className="flex gap-4 items-end mb-3">
                            <FormField
                              control={form.control}
                              name={`freeGuestDetails.${index}.type` as any}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel className="text-xs">Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="Child (0-3 years)">Child (0-3 years)</SelectItem>
                                      <SelectItem value="Guide">Guide</SelectItem>
                                      <SelectItem value="Staff">Staff</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`freeGuestDetails.${index}.quantity` as any}
                              render={({ field }) => (
                                <FormItem className="w-24">
                                  <FormLabel className="text-xs">Qty</FormLabel>
                                  <FormControl><Input type="number" min="0" {...field} onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    field.onChange(val);
                                    setTimeout(() => {
                                      const details = form.getValues('freeGuestDetails' as any) as any[];
                                      const total = details?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0;
                                      form.setValue('freeGuestCount', total);
                                    }, 0);
                                  }} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                removeFreeGuest(index);
                                setTimeout(() => {
                                  const details = form.getValues('freeGuestDetails' as any) as any[];
                                  const total = details?.reduce((sum, d) => sum + (d.quantity || 0), 0) || 0;
                                  form.setValue('freeGuestCount', total);
                                }, 0);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="border p-4 rounded-md mt-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Package Selections</label>
                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">Total Guests: {calculatedTotalGuests}</span>
                        </div>

                        {packageQuantityFields.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-md italic text-sm">Select a Yacht to view available packages</div>
                        ) : (
                          <div className="space-y-3">
                            {packageQuantityFields.map((fieldItem, index) => (
                              <div key={fieldItem.id} className="grid grid-cols-12 gap-3 items-end bg-muted/30 p-2 rounded-lg border border-transparent hover:border-slate-300 transition-all">
                                <div className="col-span-6">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Package Name</label>
                                  <Input value={fieldItem.packageName} readOnly className="h-8 text-xs bg-white font-semibold" />
                                </div>
                                <div className="col-span-3">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Rate (AED)</label>
                                  <FormField
                                    control={form.control}
                                    name={`packageQuantities.${index}.rate`}
                                    render={({ field }) => (
                                      <FormControl><Input type="number" step="0.01" className="h-8 text-xs bg-white" {...field} /></FormControl>
                                    )}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Quantity</label>
                                  <FormField
                                    control={form.control}
                                    name={`packageQuantities.${index}.quantity`}
                                    render={({ field }) => (
                                      <FormControl><Input type="number" min="0" className="h-8 text-xs bg-primary/5 focus:bg-white text-center font-bold" {...field} /></FormControl>
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <FormField
                          control={form.control}
                          name="perTicketRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Other / Adjustment Charges (AED)</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value === null ? '' : field.value} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md mt-6 bg-slate-50">
                        <FormField
                          control={form.control}
                          name="paidAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-green-700 font-bold">Total Paid Amount (AED)</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} className="border-green-200 bg-green-50/30" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="bg-slate-900 text-white p-4 rounded-lg flex flex-col justify-center items-end">
                          <span className="text-[10px] uppercase font-bold opacity-70">Remaining Balance</span>
                          <span className="text-2xl font-black">AED {form.watch('balanceAmount')?.toLocaleString() || '0.00'}</span>
                        </div>
                      </div>
                    </TabsContent>

                    {/* --- OPERATIONS TAB --- */}
                    <TabsContent value="ops" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="captainName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Captain Name</FormLabel>
                              <FormControl><Input placeholder="Captain's Name" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="idVerified"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                              <div className="space-y-0.5">
                                <FormLabel>ID Verified</FormLabel>
                                <FormDescription>Confirm guest IDs have been verified.</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="crewDetails"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Crew Assignment Details</FormLabel>
                              <FormControl><Textarea placeholder="List assigned crew members and roles..." {...field} value={field.value || ''} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="extraHoursUsed"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Extra Hours Used</FormLabel>
                              <FormControl><Input type="number" step="0.5" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="extraCharges"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Extra Charges (AED)</FormLabel>
                              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="activities" className="mt-0">
                      <div className="pt-2">
                        <ActivityLog
                          leadId={lead?.id}
                          currentUserId={currentUserId || null}
                          users={allUsers}
                        />
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </Tabs>

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
    </Dialog>
  );
}
