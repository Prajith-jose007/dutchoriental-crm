'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, paymentConfirmationStatusOptions, leadSourceOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
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
  type: z.enum([...leadTypeOptions, 'Shared Cruise'] as [string, ...string[]], { required_error: "Booking type is required." }),
  paymentConfirmationStatus: z.enum(paymentConfirmationStatusOptions, { required_error: "Payment confirmation status is required." }),
  transactionId: z.string().optional(),
  bookingRefNo: z.string().min(1, "Portal DO Number is required"),
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
  infantCount: z.coerce.number().min(0).optional().default(0),
  infantDetails: z.string().optional(),
  noShowCount: z.coerce.number().min(0).optional().default(0),
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
  perTicketRateReason: z.string().optional(),
  payAtCounterAmount: z.coerce.number().min(0).optional().nullable(),
  payAtCounterRemark: z.string().optional(),

  totalAmount: z.coerce.number().default(0),
  commissionPercentage: z.coerce.number().min(0).max(100).default(0),
  commissionAmount: z.coerce.number().optional().default(0),
  netAmount: z.coerce.number().default(0),
  paidAmount: z.coerce.number().min(0, "Paid amount must be non-negative").default(0),
  balanceAmount: z.coerce.number().default(0),
  collectedAtCheckIn: z.coerce.number().optional().default(0),

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
  allYachts?: Yacht[];
  allAgents?: Agent[];
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
    noShowCount: Number(existingLead?.noShowCount || 0),
    id: existingLead?.id || undefined,
    agent: existingLead?.agent || '',
    customAgentName: existingLead?.customAgentName || '',
    customAgentPhone: existingLead?.customAgentPhone || '',
    status: existingLead?.status || 'Pending', // Default to Pending for new leads
    month: existingLead?.month && isValid(parseISO(existingLead.month)) ? parseISO(existingLead.month) : new Date(),
    yacht: existingLead?.yacht || '',
    type: ((existingLead?.type as any) === 'Shared Cruise' ? 'Dinner Cruise' : existingLead?.type) || (undefined as any), // Map legacy 'Shared Cruise' to 'Dinner Cruise'
    paymentConfirmationStatus: existingLead?.paymentConfirmationStatus || 'CONFIRMED',
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
    infantCount: Number(existingLead?.infantCount || 0),
    infantDetails: existingLead?.infantDetails || '',
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
    perTicketRateReason: existingLead?.perTicketRateReason || '',
    payAtCounterAmount: existingLead?.payAtCounterAmount !== undefined && existingLead?.payAtCounterAmount !== null ? Number(Number(existingLead.payAtCounterAmount).toFixed(2)) : null,
    payAtCounterRemark: existingLead?.payAtCounterRemark || '',
    totalAmount: Number(Number(existingLead?.totalAmount || 0).toFixed(2)),
    commissionPercentage: Number(existingLead?.commissionPercentage || 0),
    commissionAmount: Number(Number(existingLead?.commissionAmount || 0).toFixed(2)),
    netAmount: Number(Number(existingLead?.netAmount || 0).toFixed(2)),
    paidAmount: 0, // Always starts at 0 to collect new payment
    balanceAmount: Number(Number(existingLead?.balanceAmount || 0).toFixed(2)),
    collectedAtCheckIn: Number(existingLead?.collectedAtCheckIn || 0),
    freeGuestDetails: existingLead?.freeGuestDetails || [],
    lastModifiedByUserId: existingLead?.lastModifiedByUserId || currentUserId || undefined,
    ownerUserId: existingLead?.ownerUserId || currentUserId || undefined,
    createdAt: existingLead?.createdAt || undefined,
    updatedAt: existingLead?.updatedAt || undefined,
  };
};


export function BookingFormDialog({ isOpen, onOpenChange, lead, onSubmitSuccess, currentUserId, isAdmin, allUsers: propAllUsers, allYachts: propAllYachts, allAgents: propAllAgents }: BookingFormDialogProps) {
  const { toast } = useToast();
  const [allAgents, setAllAgents] = useState<Agent[]>(propAllAgents || []);
  const [allYachts, setAllYachts] = useState<Yacht[]>(propAllYachts || []);
  const [allUsers, setAllUsers] = useState<User[]>(propAllUsers || []);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(!propAllYachts || !propAllAgents || !propAllUsers);
  const [calculatedTotalGuests, setCalculatedTotalGuests] = useState(0);
  const [cruiseScope, setCruiseScope] = useState<'private' | 'shared' | ''>('');
  const isInitializedRef = useRef(false); // tracks whether form has been initialized for current lead
  const initialYachtIdRef = useRef<string | null>(null); // tracks the yacht ID loaded at start
  const initialAgentIdRef = useRef<string | null>(null); // tracks the agent ID loaded at start
  const initialTypeIdRef = useRef<string | null>(null); // tracks the booking type loaded at start

  // Sync state from props if they update in the parent
  useEffect(() => {
    if (propAllAgents && propAllAgents.length > 0) setAllAgents(propAllAgents);
  }, [propAllAgents]);

  useEffect(() => {
    if (propAllYachts && propAllYachts.length > 0) setAllYachts(propAllYachts);
  }, [propAllYachts]);

  useEffect(() => {
    if (propAllUsers && propAllUsers.length > 0) setAllUsers(propAllUsers);
  }, [propAllUsers]);

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
  const watchedCommissionPercentage = form.watch('commissionPercentage');

  const { append: appendPackage, remove: removePackage } = useFieldArray({
    control: form.control,
    name: "packageQuantities",
  });

  const isFormDisabled = useMemo(() => {
    // Form is disabled if the booking is already in a locked state (Canceled or Checked In)
    // and the user is not an admin.
    // We check the ORIGINAL lead status (lead.status), not the current form status, to allow users to transition TO a locked status.
    if (!lead) return false;

    const isLocked = lead.status === 'Canceled';
    const isCheckedIn = (lead as any).checkInStatus === 'Checked In';

    return (isLocked || isCheckedIn) && !isAdmin;
  }, [lead, isAdmin]);


  useEffect(() => {
    const fetchDropdownData = async () => {
      // Fetch only if not provided by prop AND we don't have it yet
      const needsAgents = !propAllAgents || propAllAgents.length === 0;
      const needsYachts = !propAllYachts || propAllYachts.length === 0;
      const needsUsers = !propAllUsers || propAllUsers.length === 0;

      if (!needsAgents && !needsYachts && !needsUsers) {
        setIsLoadingDropdowns(false);
        return;
      }
      setIsLoadingDropdowns(true);
      try {
        const [agentsRes, yachtsRes, usersRes] = await Promise.all([
          needsAgents ? fetch('/api/agents') : Promise.resolve(null),
          needsYachts ? fetch('/api/yachts') : Promise.resolve(null),
          needsUsers ? fetch('/api/users') : Promise.resolve(null),
        ]);

        if (agentsRes && !agentsRes.ok) throw new Error('Failed to fetch agents for form');
        if (yachtsRes && !yachtsRes.ok) throw new Error('Failed to fetch yachts for form');
        if (usersRes && !usersRes.ok) throw new Error('Failed to fetch users for form');

        const agentsData = agentsRes ? await agentsRes.json() : propAllAgents;
        const yachtsData = yachtsRes ? await yachtsRes.json() : propAllYachts;
        const usersData = usersRes ? await usersRes.json() : propAllUsers;

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
  }, [isOpen, toast, propAllAgents, propAllYachts, propAllUsers]);


  const filteredYachts = useMemo(() => {
    if (!watchedLeadType || allYachts.length === 0) {
      return allYachts;
    }

    // Normalize case and trimmed values for accurate matching
    const targetCategory = watchedLeadType.trim().toLowerCase();

    // If user picks "Private Cruise", show all (as any yacht can be a private charter)
    if (targetCategory === 'private cruise') {
      return allYachts;
    }

    const filtered = allYachts.filter(yacht =>
      (yacht.category || '').trim().toLowerCase() === targetCategory
    );

    // Fallback: if a specific category has NO yachts assigned yet, show all to prevent blocking the user
    return filtered.length > 0 ? filtered : allYachts;
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
    // This effect runs when the user MANUALLY changes the yacht selection.
    // During initialization isInitializedRef.current is false, so we skip it.
    // Only run if initialization is truly done AND the yacht changed from the initial loaded yacht
    if (!isOpen || isLoadingDropdowns || !watchedYachtId || !isInitializedRef.current || watchedYachtId === initialYachtIdRef.current) {
      return;
    }

    const selectedYacht = allYachts.find(y => y.id === watchedYachtId);

    if (selectedYacht?.packages && Array.isArray(selectedYacht.packages)) {
      // User changed yacht manually — reset quantities to 0 with new yacht's packages
      const newPQs = selectedYacht.packages.map(yachtPkg => ({
        packageId: String(yachtPkg.id),
        packageName: String(yachtPkg.name),
        quantity: 0,
        rate: Number(Number(yachtPkg.rate || 0).toFixed(2)),
      }));
      replacePackageQuantities(newPQs);
    } else {
      replacePackageQuantities([]);
    }
  }, [isOpen, watchedYachtId, allYachts, replacePackageQuantities, isLoadingDropdowns]);


  const recalculateFinancials = useCallback((triggerFieldName?: string) => {
    const {
      packageQuantities = [],
      perTicketRate,
      agent: agentId,
      paidAmount,
      durationHours,
      yacht: yachtId,
      type: leadType,
      freeGuestCount,
      infantCount,
      commissionPercentage: currentCommission
    } = form.getValues();

    const selectedYacht = allYachts.find(y => y.id === yachtId);

    // Logic: Use current form value for discount, unless Agent just changed
    let agentDiscountRate = Number(currentCommission || 0);
    if (triggerFieldName === 'agent') {
      const selectedAgentForCalc = allAgents.find(a => a.id === agentId);
      agentDiscountRate = selectedAgentForCalc ? Number(selectedAgentForCalc.discount || 0) : 0;
      form.setValue('commissionPercentage', agentDiscountRate, { shouldValidate: true });
    }

    // Robust numerical conversion for all inputs
    const parsedPaidAmount = parseFloat(String(paidAmount || 0).replace(/,/g, ''));
    const parsedAddOnTotal = parseFloat(String(perTicketRate || 0).replace(/,/g, ''));
    const parsedPayAtCounter = parseFloat(String(form.getValues().payAtCounterAmount || 0).replace(/,/g, ''));
    const parsedCommissionPercent = parseFloat(String(agentDiscountRate || 0));
    const parsedDuration = parseFloat(String(durationHours || 0));

    let packagesTotal = 0;
    let tempTotalGuests = 0;

    // Add Yacht Base price if Private Cruise
    if (leadType === 'Private Cruise' && selectedYacht) {
      const yachtRate = Number(selectedYacht.pricePerHour || 0);
      const yachtTotal = yachtRate * parsedDuration;
      if (yachtTotal > 0) {
        packagesTotal += yachtTotal;
      }
    }

    packageQuantities.forEach(pqItem => {
      const quantity = parseFloat(String(pqItem.quantity || 0));
      const rate = parseFloat(String(pqItem.rate || 0));
      if (quantity > 0 && rate >= 0) {
        packagesTotal += quantity * rate;
      }
      tempTotalGuests += quantity;
    });

    tempTotalGuests += Number(freeGuestCount || 0);
    tempTotalGuests += Number(infantCount || 0);
    setCalculatedTotalGuests(tempTotalGuests);

    // Total Amount and Net Amount are strictly for Packages
    const calculatedTotalAmount = Number(packagesTotal.toFixed(2));
    const calculatedCommissionAmount = Number(((packagesTotal * parsedCommissionPercent) / 100).toFixed(2));
    const calculatedNetAmount = Number((calculatedTotalAmount - calculatedCommissionAmount).toFixed(2));

    // Addons and Pay at Counter are added to the Balance Due directly
    const previousTotalPaid = lead ? Number(lead.paidAmount || 0) : 0;
    const actualSignedBalanceAmount = Number(((calculatedNetAmount + parsedAddOnTotal + parsedPayAtCounter) - (previousTotalPaid + parsedPaidAmount)).toFixed(2));

    const currentVals = form.getValues();
    if (Number(currentVals.totalAmount) !== calculatedTotalAmount) form.setValue('totalAmount', calculatedTotalAmount, { shouldValidate: true });
    if (Number(currentVals.commissionAmount) !== calculatedCommissionAmount) form.setValue('commissionAmount', calculatedCommissionAmount, { shouldValidate: true });
    if (Number(currentVals.netAmount) !== calculatedNetAmount) form.setValue('netAmount', calculatedNetAmount, { shouldValidate: true });
    if (Number(currentVals.balanceAmount) !== actualSignedBalanceAmount) form.setValue('balanceAmount', actualSignedBalanceAmount, { shouldValidate: true });
  }, [form, allYachts, allAgents, lead]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        name?.startsWith('packageQuantities') ||
        name === 'perTicketRate' ||
        name === 'payAtCounterAmount' ||
        name === 'agent' ||
        name === 'paidAmount' ||
        name === 'durationHours' ||
        name === 'yacht' ||
        name === 'type' ||
        name === 'commissionPercentage' ||
        name === 'freeGuestCount' ||
        name === 'infantCount'
      ) {
        recalculateFinancials(name);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, recalculateFinancials]);


  useEffect(() => {
    // Wait until both the dialog is open AND dropdown data has finished loading
    if (!isOpen || isLoadingDropdowns) return;

    // Helper for robust name matching (ignores special chars and case)
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Reset initialization status for this lead
    isInitializedRef.current = false;

    const initialValues = getDefaultFormValues(lead, currentUserId);

    // Resolve agent/yacht from name to ID (handles CSV-imported data where only names are stored)
    let resolvedYachtId: string | undefined;
    if (lead) {
      if (allAgents.length > 0 && lead.agent) {
        const checkAgent = String(lead.agent).trim();
        const checkAgentNormalized = normalize(checkAgent);
        const matchedAgent = allAgents.find(a =>
          normalize(String(a.id)) === checkAgentNormalized ||
          normalize(String(a.name)) === checkAgentNormalized
        );
        if (matchedAgent) initialValues.agent = matchedAgent.id;
      }

      if (allYachts.length > 0 && lead.yacht) {
        const checkYacht = String(lead.yacht).trim();
        const checkYachtNormalized = normalize(checkYacht);
        const matchedYacht = allYachts.find(y =>
          normalize(String(y.id)) === checkYachtNormalized ||
          normalize(String(y.name)) === checkYachtNormalized
        );
        if (matchedYacht) {
          initialValues.yacht = matchedYacht.id;
          resolvedYachtId = matchedYacht.id;
        }
      }

      if (lead.month && !isNaN(new Date(lead.month).getTime())) {
        initialValues.month = new Date(lead.month);
      }
    }

    // Ensure cruise scope is synchronized with the type
    const currentType = initialValues.type;
    console.log("[BookingForm] Initializing Scope for type:", currentType);
    if (currentType === 'Private Cruise') {
      setCruiseScope('private');
    } else if (currentType) {
      setCruiseScope('shared');
    } else {
      setCruiseScope('');
    }

    form.reset(initialValues);

    // Set packages for the resolved yacht, preserving saved quantities from DB
    const yachtForPackages = resolvedYachtId
      ? allYachts.find(y => y.id === resolvedYachtId)
      : (initialValues.yacht ? allYachts.find(y => y.id === initialValues.yacht) : null);

    if (yachtForPackages?.packages && Array.isArray(yachtForPackages.packages)) {
      const savedPackages = lead?.packageQuantities || [];
      const newPQs = yachtForPackages.packages.map(yachtPkg => {
        // Match by ID or by name (case-insensitive) to handle CSV-imported data
        const existingPQ = savedPackages.find(lpq =>
          String(lpq.packageId) === String(yachtPkg.id) ||
          String(lpq.packageName).trim().toLowerCase() === String(yachtPkg.name).trim().toLowerCase()
        );
        return {
          packageId: String(yachtPkg.id),
          packageName: String(yachtPkg.name),
          quantity: existingPQ ? Number(existingPQ.quantity) : 0,
          rate: Number(Number(yachtPkg.rate || 0).toFixed(2)), // always use live rate from DB
        };
      });
      replacePackageQuantities(newPQs);
    } else if (lead?.packageQuantities && lead.packageQuantities.length > 0) {
      // Yacht not found in list but we have saved packages — restore them as-is
      replacePackageQuantities(lead.packageQuantities.map(pq => ({
        packageId: String(pq.packageId),
        packageName: String(pq.packageName),
        quantity: Number(pq.quantity),
        rate: Number(pq.rate),
      })));
    } else {
      replacePackageQuantities([]);
    }

    // Preserve saved commission value from DB; only fallback to agent default for new bookings
    const savedCommission = lead?.commissionPercentage;
    if (savedCommission !== undefined && savedCommission !== null) {
      form.setValue('commissionPercentage', Number(savedCommission));
    } else {
      const agentIdForCommission = initialValues.agent;
      if (agentIdForCommission && allAgents.length > 0) {
        const selectedAgentOnReset = allAgents.find(a => a.id === agentIdForCommission);
        form.setValue('commissionPercentage', Number(selectedAgentOnReset?.discount || 0));
      } else {
        form.setValue('commissionPercentage', 0);
      }
    }

    // Mark initialization complete — the yacht-change effect can now fire for user actions
    isInitializedRef.current = true;
    initialYachtIdRef.current = initialValues.yacht || null;
    initialAgentIdRef.current = initialValues.agent || null;
    initialTypeIdRef.current = initialValues.type || null;

    // Explicitly recalculate financials immediately after initialization to ensure balance is correct
    // (Handles potential stale amounts or rounding differences from DB)
    setTimeout(() => recalculateFinancials(), 100);
  }, [lead, form, isOpen, isLoadingDropdowns, allAgents, allYachts, currentUserId, replacePackageQuantities, recalculateFinancials]);


  function onSubmit(data: BookingFormData) {
    if (isFormDisabled) {
      toast({ title: "Action Denied", description: "This booking is canceled and cannot be modified by non-administrators.", variant: "destructive" });
      onOpenChange(false);
      return;
    }
    let rawPackagesTotal = 0;

    if (data.packageQuantities && Array.isArray(data.packageQuantities)) {
      data.packageQuantities.forEach(pqItem => {
        const quantity = Number(pqItem.quantity || 0);
        const rate = Number(Number(pqItem.rate || 0).toFixed(2));
        if (quantity > 0 && rate >= 0) {
          rawPackagesTotal += quantity * rate;
        }
      });
    }

    const addOnTotal = Number(data.perTicketRate || 0);
    const payAtCounterTotal = Number(data.payAtCounterAmount || 0);

    // Add Yacht Base price if Private Cruise (Synchronized with live calculation in useEffect)
    if (data.type === 'Private Cruise') {
      const selectedYachtForSubmit = allYachts.find(y => y.id === data.yacht);
      if (selectedYachtForSubmit) {
        const yachtRate = Number(selectedYachtForSubmit.pricePerHour || 0);
        const hours = Number(data.durationHours || 0);
        const yachtTotal = yachtRate * hours;
        if (yachtTotal > 0) {
          rawPackagesTotal += yachtTotal;
        }
      }
    }

    // Total Amount includes packages ONLY
    const finalTotalAmount = Number(rawPackagesTotal.toFixed(2));

    // Use the form's commission percentage (which allows manual override), fallback to agent default only if missing
    const finalCommissionPercentage = Number(data.commissionPercentage);

    // Commission applies ONLY to package total, not addons
    const finalCommissionAmount = Number(((rawPackagesTotal * finalCommissionPercentage) / 100).toFixed(2));

    // Net Amount = Total - Commission
    const finalNetAmount = Number((finalTotalAmount - finalCommissionAmount).toFixed(2));

    const previousTotalPaid = lead ? Number(lead.paidAmount || 0) : 0;
    const newPaidAmount = Number(Number(data.paidAmount || 0).toFixed(2));
    const finalPaidAmount = Number((previousTotalPaid + newPaidAmount).toFixed(2));

    // Balance = Net + Addon + PayAtCounter - Paid
    const actualSignedBalanceAmount = Number(((finalNetAmount + addOnTotal + payAtCounterTotal) - finalPaidAmount).toFixed(2));

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

    // Determine the final agent identifier to store in the 'agent' column
    // Priority: 1. Selected system agent ID, 2. Custom Agent Name, 3. 'Direct'
    let finalAgentValue = formAgent || 'Direct';
    if (finalAgentValue === 'Direct' && data.customAgentName) {
      finalAgentValue = data.customAgentName;
    }

    const submittedLead: Lead = {
      ...restOfFormData,
      type: data.type as any,
      agent: finalAgentValue,
      id: lead?.id || `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      transactionId: lead?.id && data.transactionId === "Pending Generation" ? lead.transactionId : (data.transactionId === "Pending Generation" ? undefined : data.transactionId),
      bookingRefNo: data.bookingRefNo || undefined,
      // Issue 2: Date Shifting. Force Noon logic.
      // Set the time to 12:00:00 local before formatting to ISO to avoid midnight timezone subtraction issues.
      month: data.month ? formatISO(new Date(data.month.setHours(12, 0, 0, 0))) : formatISO(new Date()),
      inquiryDate: data.inquiryDate ? formatISO(data.inquiryDate) : undefined,
      nextFollowUpDate: data.nextFollowUpDate ? formatISO(data.nextFollowUpDate) : undefined,
      paymentConfirmationStatus: data.paymentConfirmationStatus,
      freeGuestCount: Number(data.freeGuestCount || 0),
      perTicketRate: data.perTicketRate !== undefined && data.perTicketRate !== null ? Number(Number(data.perTicketRate).toFixed(2)) : undefined,
      perTicketRateReason: data.perTicketRateReason,
      payAtCounterAmount: data.payAtCounterAmount !== undefined && data.payAtCounterAmount !== null ? Number(Number(data.payAtCounterAmount).toFixed(2)) : undefined,
      payAtCounterRemark: data.payAtCounterRemark,
      createdAt: lead?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      lastModifiedByUserId: currentUserId || undefined,
      ownerUserId: lead?.ownerUserId || currentUserId || undefined,
      customAgentName: data.customAgentName,
      customAgentPhone: data.customAgentPhone,
      packageQuantities: finalPackageQuantities,
      collectedAtCheckIn: data.collectedAtCheckIn || 0,
      noShowCount: data.noShowCount || 0,
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
            {lead ? (isFormDisabled ? 'This booking is canceled and cannot be edited by non-administrators.' : 'Update the details for this booking.') : 'Fill in the details for the new booking.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          {isFormDisabled && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Booking Canceled</AlertTitle>
              <AlertDescription>
                This booking is canceled and cannot be edited by non-administrators.
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

                    {/* Customer Phone */}
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Phone</FormLabel>
                          <FormControl><Input placeholder="Client Phone (e.g. +971...)" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Customer Email */}
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Email</FormLabel>
                          <FormControl><Input type="email" placeholder="client@example.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Agent Section */}
                    <div className="space-y-4 rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                      <FormField
                        control={form.control}
                        name="agent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex justify-between items-center">
                              <span>Agent</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">System Registered</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select Agent" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Direct">Direct / None</SelectItem>
                                {allAgents.map((agent) => (<SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>))}
                                {field.value && !allAgents.some(a => a.id === field.value) && field.value !== "Direct" && (
                                  <SelectItem value={field.value}>{field.value}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Custom Agent Name (Always show as optional backup or if Direct is selected) */}
                      {(form.watch('agent') === 'Direct' || !form.watch('agent')) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                          <FormField
                            control={form.control}
                            name="customAgentName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Agent Name</FormLabel>
                                <FormControl><Input placeholder="Name for manual agent" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="customAgentPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Agent Phone</FormLabel>
                                <FormControl><Input placeholder="+971..." {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

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
                              const prevVal = field.value;
                              field.onChange(val);
                              if (val === 'Private Cruise') setCruiseScope('private');
                              else setCruiseScope('shared');

                              // Only reset if it's a genuine user change from the initial value
                              if (val !== initialTypeIdRef.current || (isInitializedRef.current && val !== prevVal)) {
                                form.setValue('yacht', '');
                                replacePackageQuantities([]);
                              }
                            }}
                            value={field.value || undefined}
                          >
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {leadTypeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              {/* Legacy Fallback if needed (e.g. from older data) */}
                              {field.value && !leadTypeOptions.includes(field.value as any) && (
                                <SelectItem value={field.value}>{field.value}</SelectItem>
                              )}
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
                            fromYear={2024}
                            toYear={2030}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* --- ROW 2: CRUISE DETAILS (Conditional) --- */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4">
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
                              {filteredYachts.map((yacht) => (
                                <SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>
                              ))}
                              {/* Fallback for cases where yacht ID in DB doesn't match current filter or list (e.g. from CSV) */}
                              {field.value && !filteredYachts.some(y => y.id === field.value) && (
                                <SelectItem value={field.value}>
                                  {allYachts.find(y => y.id === field.value)?.name || field.value}
                                </SelectItem>
                              )}
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
                          <FormLabel>Portal DO Number <span className="text-red-500">*</span></FormLabel>
                          <FormControl><Input placeholder="Ticket No" {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* No-Show Count */}
                    <FormField
                      control={form.control}
                      name="noShowCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>No-Show Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value !== undefined ? String(field.value) : '0'}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Infant Count */}
                    <FormField
                      control={form.control}
                      name="infantCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Infant Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              value={field.value !== undefined ? String(field.value) : '0'}
                              onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                  
                  {form.watch('infantCount') !== undefined && form.watch('infantCount') > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="infantDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Infant Details (Names, Ages)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="E.g. John (1.5 yrs), Mary (6 months)"
                                className="min-h-[60px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}


                  {/* --- PACKAGES GRID --- */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-4">
                        <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Packages (As per Boat)</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => appendPackage({ packageId: `custom-${Date.now()}`, packageName: 'New Package', quantity: 1, rate: 0 })}
                        >
                          + Add Custom Item
                        </Button>
                      </div>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">Total Guests: {calculatedTotalGuests}</span>
                    </div>

                    {packageQuantityFields.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground border border-dashed rounded-md text-sm">Select a Yacht to view packages</div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {packageQuantityFields.map((fieldItem, index) => (
                          <div key={fieldItem.id} className="bg-muted/20 p-3 rounded-lg border hover:border-primary/50 transition-colors relative group">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removePackage(index)}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>

                            <FormField
                              control={form.control}
                              name={`packageQuantities.${index}.packageName`}
                              render={({ field }) => (
                                <input
                                  className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block truncate bg-transparent border-none w-full focus:outline-none focus:ring-1 focus:ring-primary/30 rounded"
                                  title={field.value}
                                  {...field}
                                />
                              )}
                            />

                            <div className="flex gap-2 items-center mb-1">
                              <span className="text-[10px] text-muted-foreground shrink-0">AED</span>
                              <FormField
                                control={form.control}
                                name={`packageQuantities.${index}.rate`}
                                render={({ field }) => (
                                  <input
                                    type="number"
                                    className="text-[10px] text-muted-foreground bg-transparent border-none w-16 focus:outline-none focus:ring-1 focus:ring-primary/30 rounded"
                                    {...field}
                                  />
                                )}
                              />
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="perTicketRate"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Other Package Amount (Added to Balance Due)</FormLabel>
                          <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value === null ? '' : field.value} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="perTicketRateReason"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs font-bold uppercase text-muted-foreground">Addon Reason</FormLabel>
                          <FormControl><Input placeholder="Reason for charges..." {...field} value={field.value || ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Pay At Counter fields */}
                  <div className="flex flex-col md:flex-row gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="payAtCounterAmount"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs font-bold uppercase text-red-500">Pay at Counter Amount</FormLabel>
                          <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value === null ? '' : field.value} className="border-red-200" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="payAtCounterRemark"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-xs font-bold uppercase text-red-500">Pay at Counter Remark</FormLabel>
                          <FormControl><Input placeholder="Remark..." {...field} value={field.value || ''} className="border-red-200" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                    {/* Previous Total Paid Amount */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium leading-none flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" /> Total Paid (History)
                      </label>
                      <div className="flex h-10 w-full rounded-md border border-input bg-slate-100 px-3 py-2 text-sm text-slate-500 font-bold">
                        AED {(lead ? Number(lead.paidAmount || 0) : 0).toLocaleString()}
                      </div>
                    </div>

                    {/* Paid Amount */}
                    <FormField
                      control={form.control}
                      name="paidAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-green-700 font-bold flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Collect New Payment
                          </FormLabel>
                          <FormControl><Input type="number" step="0.01" {...field} className="border-green-300 bg-green-50 text-green-900 font-bold placeholder:text-green-300" placeholder="0.00" /></FormControl>
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
