
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { BookingsTable, generateBookingColumns, type BookingTableColumn } from './_components/BookingsTable';
import { DailyBookingsStats } from '@/components/DailyBookingsStats';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { BookingFormDialog } from './_components/BookingFormDialog';
import type { Lead, LeadStatus, User, Agent, Yacht, LeadType, LeadPackageQuantity, PaymentConfirmationStatus, YachtPackageItem, YachtCategory, Invoice } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, paymentConfirmationStatusOptions, type ModeOfPayment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/use-user-role';
import { format, parseISO, isWithinInterval, isValid, formatISO, getYear as getFullYear, getMonth as getMonthIndex, addDays, parse } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2, Printer } from 'lucide-react';
import { validateCSVRow, formatValidationResult, type CSVRowData, type CSVValidationResult } from '@/lib/csvValidation';
import { leadCsvHeaderMapping as csvHeaderMapping, convertLeadCsvValue as convertCsvValue, parseCsvLine, applyPackageTypeDetection } from '@/lib/csvHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';


const USER_ID_STORAGE_KEY = 'currentUserId';
const USER_ROLE_STORAGE_KEY = 'currentUserRole';














function generateNewLeadId(existingLeadIds: string[]): string {
  const prefix = "DO-";
  let maxNum = 100; // Force start from 101
  existingLeadIds.forEach(id => {
    if (id && id.startsWith(prefix)) {
      const numPart = parseInt(id.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

function generateNewLeadTransactionId(existingLeads: Lead[], forYear: number, currentMaxForYearInBatch: number = 0): string {
  const prefix = `TRN-${forYear}-`;
  let maxNumber = currentMaxForYearInBatch;

  existingLeads.forEach(lead => {
    if (lead.transactionId && lead.transactionId.startsWith(prefix)) {
      const numPartStr = lead.transactionId.substring(prefix.length);
      const numPart = parseInt(numPartStr, 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    }
  });
  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

interface CalculatedPackageCounts {
  child: number; adult: number; childTopDeck: number; adultTopDeck: number; adultAlc: number;
  vipChild: number; vipAdult: number; vipAlc: number;
  royalChild: number; royalAdult: number; royalAlc: number;
  basicSY: number; standardSY: number; premiumSY: number; vipSY: number;
  hourCharterPC: number;
  others: number;
}

const packageCountLabels: Record<keyof CalculatedPackageCounts, string> = {
  child: 'CHILD', adult: 'ADULT', childTopDeck: 'CHILD TOP DECK', adultTopDeck: 'ADULT TOP DECK', adultAlc: 'ADULT ALC',
  vipChild: 'VIP CHILD', vipAdult: 'VIP ADULT', vipAlc: 'VIP ALC',
  royalChild: 'ROYAL CHILD', royalAdult: 'ROYAL ADULT', royalAlc: 'ROYAL ALC',
  basicSY: 'BASIC (SY)', standardSY: 'STANDARD (SY)', premiumSY: 'PREMIUM (SY)', vipSY: 'VIP (SY)',
  hourCharterPC: 'HOUR CHARTER (PC)',
  others: 'OTHERS (Rate)',
};


export default function BookingsPage() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [agentMap, setAgentMap] = useState<{ [id: string]: string }>({});
  const [yachtMap, setYachtMap] = useState<{ [id: string]: string }>({});

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [paymentConfirmationStatusFilter, setPaymentConfirmationStatusFilter] = useState<PaymentConfirmationStatus | 'all'>('all');
  const [selectedYachtId, setSelectedYachtId] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedUserIdFilter, setSelectedUserIdFilter] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { hasPermission, role: currentUserRole } = useUserRole();
  const canDelete = hasPermission('delete_bookings');
  const canBypassClosed = hasPermission('bypass_closed_lock');
  const canImport = hasPermission('manage_bookings');

  // Legacy 'isAdmin' mapping: used for bulk delete and previously for closed status bypass.
  // We strictly distinguish now.
  // const isAdmin = canDelete; // We will replace usages instead.
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [importPreviewLeads, setImportPreviewLeads] = useState<Lead[]>([]);
  const [isShowingImportPreview, setIsShowingImportPreview] = useState(false);
  const [importSkippedCount, setImportSkippedCount] = useState(0);


  const fetchAllData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [leadsRes, agentsRes, yachtsRes, usersRes] = await Promise.all([
        fetch('/api/leads?limit=3500'),
        fetch('/api/agents'),
        fetch('/api/yachts'),
        fetch('/api/users'),
      ]);

      if (!leadsRes.ok) throw new Error(`Failed to fetch bookings: ${leadsRes.statusText}`);
      const leadsData = await leadsRes.json();
      setAllLeads(Array.isArray(leadsData) ? leadsData : []);

      if (!agentsRes.ok) throw new Error(`Failed to fetch agents: ${agentsRes.statusText}`);
      const agentsData = await agentsRes.json();
      setAllAgents(Array.isArray(agentsData) ? agentsData : []);
      const newAgentMap: { [id: string]: string } = {};
      if (Array.isArray(agentsData)) {
        agentsData.forEach(agent => { newAgentMap[agent.id] = agent.name; });
      }
      setAgentMap(newAgentMap);

      if (!yachtsRes.ok) throw new Error(`Failed to fetch yachts: ${yachtsRes.statusText}`);
      const yachtsData = await yachtsRes.json();
      setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
      const newYachtMap: { [id: string]: string } = {};
      if (Array.isArray(yachtsData)) {
        yachtsData.forEach(yacht => { newYachtMap[yacht.id] = yacht.name; });
      }
      setYachtMap(newYachtMap);

      if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
      const usersData: User[] = await usersRes.json();
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      const map: { [id: string]: string } = {};
      if (Array.isArray(usersData)) {
        usersData.forEach(user => { map[user.id] = user.name; });
      }
      setUserMap(map);

    } catch (error) {
      console.error("Error fetching initial data for Bookings page:", error);
      setFetchError((error as Error).message);
      toast({ title: 'Error Fetching Data', description: (error as Error).message, variant: 'destructive' });
      setAllLeads([]); setAllAgents([]); setAllYachts([]); setUserMap({}); setAgentMap({}); setYachtMap({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
      setCurrentUserId(storedUserId);
    } catch (e) {
      console.error("Error accessing localStorage for user details:", e);
    }
    fetchAllData();
  }, []);

  const handleAddBookingClick = () => {
    setEditingLead(null);
    setIsLeadDialogOpen(true);
  };

  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleLeadFormSubmit = async (submittedLeadData: Lead) => {
    setIsLoading(true);
    try {
      if (!currentUserId || !currentUserRole) {
        throw new Error('Authentication Error: User details not found. Please re-login.');
      }

      const isNewLead = !editingLead || !submittedLeadData.id || submittedLeadData.id.startsWith('temp-');
      let finalTransactionId = submittedLeadData.transactionId;

      if (isNewLead && (!finalTransactionId || String(finalTransactionId).trim() === "" || finalTransactionId === "Pending Generation")) {
        const leadYear = submittedLeadData.month ? getFullYear(parseISO(submittedLeadData.month)) : new Date().getFullYear();
        finalTransactionId = generateNewLeadTransactionId(allLeads, leadYear);
      }

      const payload: Partial<Lead> & { requestingUserId: string; requestingUserRole: string } = {
        ...submittedLeadData,
        transactionId: finalTransactionId,
        lastModifiedByUserId: currentUserId,
        updatedAt: new Date().toISOString(),
        month: submittedLeadData.month ? formatISO(parseISO(submittedLeadData.month)) : formatISO(new Date()),
        paymentConfirmationStatus: submittedLeadData.paymentConfirmationStatus,
        packageQuantities: submittedLeadData.packageQuantities?.map(pq => ({
          ...pq,
          quantity: Number(pq.quantity || 0),
          rate: Number(pq.rate || 0)
        })) || [],
        freeGuestCount: Number(submittedLeadData.freeGuestCount || 0),
        perTicketRate: submittedLeadData.perTicketRate !== undefined && submittedLeadData.perTicketRate !== null ? Number(submittedLeadData.perTicketRate) : undefined,
        requestingUserId: currentUserId,
        requestingUserRole: currentUserRole,
        status: submittedLeadData.status,
      };

      let payloadToSubmit: any = { ...payload };

      if (isNewLead) {
        payloadToSubmit.ownerUserId = currentUserId;
        payloadToSubmit.createdAt = new Date().toISOString();
        if (payloadToSubmit.id && payloadToSubmit.id.startsWith('temp-')) {
          const { id, ...rest } = payloadToSubmit;
          payloadToSubmit = rest;
        } else if (!payloadToSubmit.id) {
          const { id, ...rest } = payloadToSubmit;
          payloadToSubmit = rest;
        }
      } else if (editingLead) {
        payloadToSubmit.ownerUserId = editingLead.ownerUserId || currentUserId;
        payloadToSubmit.createdAt = editingLead.createdAt || new Date().toISOString();
        if (editingLead.status.startsWith('Closed') && !canBypassClosed) {
          throw new Error("Action Denied: Closed bookings cannot be modified by non-administrators.");
        }
      }

      console.log("[BookingsPage] Submitting booking payload:", JSON.stringify(payloadToSubmit, null, 2));

      let response;
      if (editingLead && payloadToSubmit.id === editingLead.id) {
        response = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadToSubmit),
        });
      } else {
        response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadToSubmit),
        });
      }

      if (!response.ok) {
        let descriptiveMessage = `API Error: ${response.status} ${response.statusText}`;
        let errorDetailsLog = '';
        try {
          const parsedError = await response.json();
          console.error("[BookingsPage] Parsed API error response from form submit:", parsedError);
          descriptiveMessage = parsedError.message || descriptiveMessage;
          errorDetailsLog = JSON.stringify(parsedError.error) || '';
        } catch (jsonError) {
          console.warn("[BookingsPage] API error response body was not valid JSON or was empty.", jsonError);
        }
        const finalErrorMessage = descriptiveMessage + (errorDetailsLog ? ` - Details: ${errorDetailsLog}` : '');
        throw new Error(finalErrorMessage);
      }

      toast({
        title: editingLead ? 'Booking Updated' : 'Booking Added',
        description: `Booking for ${submittedLeadData.clientName} has been saved.`,
      });

      await fetchAllData();
      setIsLeadDialogOpen(false);
      setEditingLead(null);

    } catch (error) {
      console.error("[BookingsPage] Error saving booking:", error);
      toast({ title: 'Error Saving Booking', description: (error as Error).message, variant: 'destructive' });
      // Keep dialog open on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!currentUserId || !currentUserRole) {
      toast({ title: 'Authentication Error', description: 'User details not found. Please re-login.', variant: 'destructive' });
      return;
    }
    if (!canDelete) {
      toast({ title: "Access Denied", description: "You do not have permission to delete bookings.", variant: "destructive" });
      return;
    }
    const leadToDelete = allLeads.find(l => l.id === leadId);
    if (leadToDelete?.status.startsWith('Closed') && !canBypassClosed) {
      toast({ title: "Action Denied", description: "Closed bookings cannot be deleted by non-administrators.", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete booking ${leadId}? This action cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestingUserId: currentUserId,
          requestingUserRole: currentUserRole
        }),
      });
      if (!response.ok) {
        let errorData = { message: `API Error: ${response.status} ${response.statusText}`, details: '' };
        try {
          const parsedError = await response.json();
          errorData.message = parsedError.message || errorData.message;
          if (parsedError.errorDetails) errorData.details = JSON.stringify(parsedError.errorDetails);
          else if (parsedError.error) errorData.details = JSON.stringify(parsedError.error);
        } catch (jsonError) {
          console.warn("[BookingsPage] API error response on delete was not valid JSON or was empty.", jsonError);
        }
        console.error("[BookingsPage] API Delete Error response data (parsed or fallback):", errorData);
        throw new Error(errorData.message + (errorData.details ? ` - Details: ${errorData.details}` : ''));
      }
      toast({ title: 'Booking Deleted', description: `Booking ${leadId} has been deleted.` });
      await fetchAllData();
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({ title: 'Error Deleting Booking', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async (lead: Lead) => {
    if (!lead) return;

    toast({ title: 'Generating Invoice...', description: `Creating invoice for booking ${lead.id}.` });

    try {
      const newInvoice: Omit<Invoice, 'createdAt'> = {
        id: `inv-${lead.id}`,
        leadId: lead.id,
        clientName: lead.clientName,
        amount: lead.netAmount,
        dueDate: formatISO(addDays(parseISO(lead.month), 7)),
        status: 'Pending',
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
        if (response.status === 409) {
          throw new Error('An invoice for this booking already exists.');
        }
        throw new Error(errorData.message || 'Failed to generate invoice.');
      }

      const createdInvoice = await response.json();
      toast({
        title: 'Invoice Generated Successfully',
        description: `Invoice ${createdInvoice.id} has been created.`,
      });

    } catch (error) {
      console.error("Error generating invoice:", error);
      toast({ title: 'Error Generating Invoice', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSelectLead = (leadId: string, isSelected: boolean) => {
    setSelectedLeadIds(prevSelected =>
      isSelected ? [...prevSelected, leadId] : prevSelected.filter(id => id !== leadId)
    );
  };

  const handleSelectAllLeads = (isSelected: boolean) => {
    setSelectedLeadIds(isSelected ? filteredLeads.map(lead => lead.id) : []);
  };

  const handleChangeSelectedLeadsStatus = async (newStatus: LeadStatus) => {
    if (selectedLeadIds.length === 0) {
      toast({ title: 'No Bookings Selected', description: 'Please select bookings to change their status.', variant: 'destructive' });
      return;
    }
    if (!currentUserId || !currentUserRole) {
      toast({ title: 'Authentication Error', description: 'Cannot change status. User details missing.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedLeadIds,
          status: newStatus,
          requestingUserId: currentUserId,
          requestingUserRole: currentUserRole,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update statuses: ${response.statusText}`);
      }

      const { updatedCount, failedCount, errors } = responseData;
      let toastDescription = `${updatedCount} booking(s) updated to ${newStatus}.`;
      if (failedCount > 0) {
        toastDescription += ` ${failedCount} booking(s) could not be updated due to permissions or status.`;
        console.warn("Bulk status update failures:", errors);
      }
      toast({ title: 'Status Update Complete', description: toastDescription });

      await fetchAllData();
      setSelectedLeadIds([]);

    } catch (error) {
      console.error("Error changing selected bookings status:", error);
      toast({ title: 'Error Updating Statuses', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelectedLeads = async () => {
    if (selectedLeadIds.length === 0) {
      toast({ title: "No Bookings Selected", description: "Please select bookings to delete.", variant: "destructive" });
      return;
    }
    if (!canDelete) {
      toast({ title: "Access Denied", description: "Only administrators can perform bulk delete.", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected bookings? This action cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {

      let successfulDeletes = 0;
      let failedDeletes = 0;

      for (const leadId of selectedLeadIds) {
        const leadToDelete = allLeads.find(l => l.id === leadId);
        if (leadToDelete?.status.startsWith('Closed') && !canBypassClosed) {
          failedDeletes++;
          continue;
        }
        const response = await fetch(`/api/leads/${leadId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestingUserId: currentUserId,
            requestingUserRole: currentUserRole
          }),
        });
        if (response.ok) {
          successfulDeletes++;
        } else {
          failedDeletes++;
          const errorData = await response.json().catch(() => ({ message: `Failed to delete booking ${leadId}` }));
          console.warn(`Failed to delete booking ${leadId}: ${errorData.message}`);
        }
      }

      let toastDescription = `${successfulDeletes} bookings deleted.`;
      if (failedDeletes > 0) {
        toastDescription += ` ${failedDeletes} bookings could not be deleted.`;
      }
      toast({ title: 'Bulk Delete Complete', description: toastDescription });

      await fetchAllData();
      setSelectedLeadIds([]);

    } catch (error) {
      console.error("Error deleting selected bookings:", error);
      toast({ title: 'Error Deleting Bookings', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  // Import definition at top of file needed?
  // We can just use string or import the type if we want strictness.
  // Assuming strictness is good but 'any' is easier for the callback signature matching if imports are messy.
  // usage: const handleCsvImport = async (file: File, source: string) => { ... }

  const handleCsvImport = async (file: File, source: string = 'DEFAULT') => {
    if (!currentUserId) {
      toast({ title: 'Error', description: 'Current user ID not found. Cannot set owner for imported bookings.', variant: 'destructive' });
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const importSource = source as any;

    setIsImporting(true);
    toast({ title: 'Import Started', description: `Processing ${source} CSV file...` });
    const startTime = Date.now();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      let currentSkippedCount = 0;

      if (!csvText) {
        toast({ title: 'Import Error', description: 'Could not read CSV file.', variant: 'destructive' });
        setIsImporting(false);
        return;
      }
      try {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast({ title: 'Import Error', description: 'CSV must have a header and at least one data row.', variant: 'destructive' });
          setIsImporting(false);
          return;
        }

        let headerLine = lines[0];
        if (headerLine.charCodeAt(0) === 0xFEFF) {
          headerLine = headerLine.substring(1);
        }
        // Detect delimiter (Comma vs Tab)
        const tabCount = (headerLine.match(/\t/g) || []).length;
        const commaCount = (headerLine.match(/,/g) || []).length;
        const delimiter = tabCount > commaCount ? '\t' : ',';

        console.log(`[CSV Import Bookings] Detected delimiter: "${delimiter === '\t' ? '\\t' : ','}"`);

        const fileHeaders = parseCsvLine(headerLine, delimiter).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        console.log("[CSV Import Bookings] Detected Normalized Headers:", fileHeaders);

        // Auto-Detect Ruzinn Format
        // Ruzinn headers typically include: TicketNumber, YachtName, Booking RefNO
        let detectedSource = importSource;
        if (fileHeaders.includes('ticketnumber') && fileHeaders.includes('yachtname')) {
          console.log("[CSV Import] Auto-detected RUZINN format based on headers.");
          detectedSource = 'RUZINN';
        } else if (fileHeaders.includes('master_qty_dhow_child') || fileHeaders.includes('oe_food_149')) {
          console.log("[CSV Import] Auto-detected MASTER format based on headers.");
          detectedSource = 'MASTER';
        }

        const newLeadsFromCsv: Lead[] = [];
        const currentLeadIds = new Set(allLeads.map(l => l.id));

        // OPTIMIZATION: Pre-calculate sets for fast duplicate detection
        const existingClientNames = new Set(allLeads.map(l => l.clientName.toLowerCase().trim()));
        const existingBookingRefs = new Set(allLeads.filter(l => l.bookingRefNo).map(l => l.bookingRefNo!.toLowerCase().trim()));
        const batchClientNames = new Set<string>();
        const batchBookingRefs = new Set<string>();

        const packageReverseHeaderMap: { [shortHeader: string]: string } = {};
        Object.entries(csvHeaderMapping).forEach(([csvKey, internalKey]) => {
          if (internalKey && internalKey.startsWith('pkg_')) {
            const actualPackageName = internalKey.substring('pkg_'.length).replace(/_/g, ' ').toUpperCase();
            packageReverseHeaderMap[csvKey] = actualPackageName;
          }
        });

        const batchMaxTransactionNumbersByYear: { [year: number]: number } = {};

        const parsedRows: Array<Partial<Lead & { package_quantities_json_string?: LeadPackageQuantity[] } & { [key: `pkg_${string}`]: number } & { _originalRowIndex: number }>> = [];

        // 1. First Pass: Parse all rows and apply package detection
        for (let i = 1; i < lines.length; i++) {
          let data = parseCsvLine(lines[i], delimiter);

          // Check if line is effectively empty
          const isEffectivelyEmpty = data.every(col => !col || col.trim() === '');
          if (isEffectivelyEmpty) {
            continue; // Skip empty lines silently
          }

          if (data.length > fileHeaders.length) {
            const extraColumns = data.slice(fileHeaders.length);
            const allExtraAreEmpty = extraColumns.every(col => (col || '').trim() === '');
            if (allExtraAreEmpty) {
              data = data.slice(0, fileHeaders.length);
            }
          }

          if (data.length !== fileHeaders.length) {
            console.warn(`[CSV Import Bookings] Skipping malformed CSV line ${i + 1}: Expected ${fileHeaders.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            currentSkippedCount++;
            continue;
          }

          const parsedRow = {} as any;
          fileHeaders.forEach((fileHeader, index) => {
            const leadKey = csvHeaderMapping[fileHeader] || csvHeaderMapping[fileHeader.toLowerCase()];
            if (leadKey) {
              parsedRow[leadKey] = convertCsvValue(leadKey, data[index], allYachts, agentMap, userMap, yachtMap);
            }
          });

          // Capture original values for package detection
          let yachtNameFromCsv = '';
          fileHeaders.forEach((header, idx) => {
            if (csvHeaderMapping[header] === 'yacht') yachtNameFromCsv = data[idx]?.trim() || '';
          });

          // Package Type Detection Logic
          applyPackageTypeDetection(yachtNameFromCsv, parsedRow, detectedSource);

          parsedRow._originalRowIndex = i + 1;
          parsedRows.push(parsedRow);
        }

        // 2. Grouping Logic
        const bookingGroups = new Map<string, typeof parsedRows>();
        const ungroupedRows: typeof parsedRows = [];

        parsedRows.forEach(row => {
          if (row.bookingRefNo) {
            if (!bookingGroups.has(row.bookingRefNo)) {
              bookingGroups.set(row.bookingRefNo, []);
            }
            bookingGroups.get(row.bookingRefNo)!.push(row);
          } else {
            ungroupedRows.push(row);
          }
        });

        // 3. Process Groups into Leads
        const processParsedRowToLead = (rows: typeof parsedRows, isGroup: boolean): Lead | null => {
          const primaryRow = rows[0]; // Use first row as template
          if (!primaryRow) return null;

          // Aggregate quantities
          const aggregatedPkg: { [key: string]: number } = {};
          let totalPaid = 0;
          const ticketNumbers: string[] = [];

          rows.forEach(r => {
            Object.keys(r).forEach(k => {
              if (k.startsWith('pkg_')) {
                aggregatedPkg[k] = (aggregatedPkg[k] || 0) + ((r as any)[k] as number || 0);
              }
            });
            if (r.paidAmount) totalPaid += Number(r.paidAmount);
            if (r.transactionId) ticketNumbers.push(r.transactionId);
          });

          // Build PackageQuantities list
          const leadYachtId = primaryRow.yacht || '';
          const yachtForLead = allYachts.find(y => y.id === leadYachtId || y.name.toLowerCase() === String(leadYachtId).toLowerCase());

          const packageQuantities: LeadPackageQuantity[] = [];
          if (yachtForLead && yachtForLead.packages) {
            Object.entries(aggregatedPkg).forEach(([key, qty]) => {
              if (qty <= 0) return;

              // Derive canonical package name from internal key (e.g., 'pkg_adult_alc' -> 'ADULT ALC')
              const actualPackageName = key.startsWith('pkg_')
                ? key.substring('pkg_'.length).replace(/_/g, ' ').toUpperCase()
                : key.toUpperCase();

              // Robust finding: try exact (case-insensitive) then fuzzy
              let p = yachtForLead.packages?.find(pkg => pkg.name.toUpperCase() === actualPackageName);

              if (!p) {
                // Fuzzy match: if target is "ADULT", handle "Adult pp", "Food only (Adult)", etc.
                p = yachtForLead.packages?.find(pkg => {
                  const n = pkg.name.toUpperCase();

                  // STRICT EXCLUSION RULES to prevent cross-tier matching

                  // 1. Basic vs Premium Tiers
                  if ((actualPackageName === 'ADULT' || actualPackageName === 'CHILD') &&
                    (n.includes('VIP') || n.includes('ROYAL') || n.includes('TOP DECK'))) {
                    return false;
                  }

                  // 2. VIP vs Royal
                  if (actualPackageName.includes('VIP') && n.includes('ROYAL')) return false;
                  if (actualPackageName.includes('ROYAL') && n.includes('VIP') && !n.includes('VIP ROOM')) return false; // Allow VIP Room if unrelated to tier? safely exclude for now.

                  // 3. Top Deck Isolation
                  if (actualPackageName.includes('TOP DECK') && !n.includes('TOP DECK')) return false;
                  if (!actualPackageName.includes('TOP DECK') && n.includes('TOP DECK')) return false;

                  // 4. Alcohol vs Non-Alcohol (Basic)
                  const isAlcPackage = actualPackageName.includes('ALC') || actualPackageName.includes('ALCOHOL');
                  if (isAlcPackage) {
                    // If looking for alcohol, ensure target isn't just "Soft Drinks" or "Child"
                    if (n.includes('SOFT') || n.includes('CHILD')) return false;
                    // Crucial: If import asks for ALC, the package MUST have ALC/ALCOHOL/DRINKS (unless it's just 'Adult' which is ambiguous, but usually distinguishing from Soft)
                    if (!n.includes('ALC') && !n.includes('ALCOHOL') && !n.includes('DRINKS') && !n.includes('HARD')) return false;
                  } else {
                    // If NOT looking for alcohol, avoid Alcohol packages
                    if (n.includes('ALC') || n.includes('ALCOHOL')) return false;
                  }

                  return n.includes(actualPackageName) || actualPackageName.includes(n);
                });
              }

              if (p) {
                const existing = packageQuantities.find(pq => pq.packageId === p!.id);
                if (existing) {
                  existing.quantity += qty;
                } else {
                  packageQuantities.push({
                    packageId: p.id,
                    packageName: p.name,
                    quantity: qty,
                    rate: p.rate
                  });
                }
              } else {
                console.warn(`[CSV Import] Package derived from "${key}" (as "${actualPackageName}") not found on yacht "${yachtForLead.name}". Skipping.`);
              }
            });
          }

          // Transaction Generation
          const leadYear = primaryRow.month ? getFullYear(parseISO(primaryRow.month)) : new Date().getFullYear();
          let transactionIdForRow = ticketNumbers[0] || primaryRow.transactionId; // Use first ticket or existing

          // If no transaction ID, generate new one (logic from before)
          if (!transactionIdForRow || String(transactionIdForRow).trim() === '') {
            const currentMax = batchMaxTransactionNumbersByYear[leadYear] || 0;
            transactionIdForRow = generateNewLeadTransactionId(allLeads, leadYear, currentMax);
            const numPart = parseInt(transactionIdForRow.slice(transactionIdForRow.lastIndexOf('-') + 1), 10); // Simplified
            if (!isNaN(numPart)) batchMaxTransactionNumbersByYear[leadYear] = numPart;
          }

          // Append tickets to notes if grouped
          let additionalNotes = primaryRow.notes || '';
          if (isGroup && ticketNumbers.length > 0) {
            additionalNotes += `\n[Merged Tickets]: ${ticketNumbers.join(', ')}`;
          }

          // Calculate Financials (Total, Commission, Net, Balance)
          let calculatedTotal = 0;
          packageQuantities.forEach(pq => {
            calculatedTotal += (pq.quantity * pq.rate);
          });

          // Get Agent Discount
          const agentId = primaryRow.agent;
          const agentForLead = allAgents.find(a => a.id === agentId);
          const discountPercentage = agentForLead ? agentForLead.discount : 0;

          const calculatedCommission = calculatedTotal * (discountPercentage / 100);
          const calculatedNet = calculatedTotal - calculatedCommission;

          // Auto-calculate paid amount if status is confirmed (Assuming Full Payment)
          if (primaryRow.status === 'Confirmed' && totalPaid === 0) {
            totalPaid = calculatedTotal;
          }

          const calculatedBalance = calculatedNet - totalPaid;

          const fullLead: Lead = {
            id: primaryRow.id || `imported-${Date.now()}-${primaryRow._originalRowIndex}`,
            clientName: primaryRow.clientName || 'N/A',
            agent: primaryRow.agent || 'Direct Booking',
            yacht: primaryRow.yacht || '',
            status: primaryRow.status || 'Confirmed',
            month: primaryRow.month || formatISO(new Date()),
            notes: additionalNotes,
            type: primaryRow.type || 'Shared Cruise',
            paymentConfirmationStatus: primaryRow.paymentConfirmationStatus || 'CONFIRMED',
            transactionId: transactionIdForRow,
            bookingRefNo: primaryRow.bookingRefNo || '',
            modeOfPayment: primaryRow.modeOfPayment || 'CARD',
            packageQuantities: packageQuantities,
            freeGuestCount: primaryRow.freeGuestCount || 0,
            perTicketRate: primaryRow.perTicketRate,
            totalAmount: calculatedTotal,
            commissionPercentage: discountPercentage,
            commissionAmount: calculatedCommission,
            netAmount: calculatedNet,
            paidAmount: totalPaid, // CSV aggregated paid amount
            balanceAmount: calculatedBalance,
            createdAt: primaryRow.createdAt || formatISO(new Date()),
            updatedAt: formatISO(new Date()),
            lastModifiedByUserId: currentUserId,
            ownerUserId: primaryRow.ownerUserId || currentUserId,
          };

          // VALIDATION
          const csvRowData: CSVRowData = {
            rowNumber: primaryRow._originalRowIndex || 0,
            agentName: fullLead.agent,
            yachtId: fullLead.yacht,
            packageQuantities: fullLead.packageQuantities,
            paidAmount: fullLead.paidAmount,
            totalAmount: fullLead.totalAmount,
            clientName: fullLead.clientName
          };
          const validationResult = validateCSVRow(csvRowData, allAgents, allYachts);
          console.log(formatValidationResult(primaryRow._originalRowIndex || 0, validationResult, fullLead.clientName));

          if (!validationResult.isValid) {
            const w = validationResult.errors.join('; ');
            console.warn(`[CSV Validation] Row ${primaryRow._originalRowIndex}: ${w}`);
            fullLead.notes += `\n[VALIDATION WARNING]: ${w}`;
          } else {
            console.log(`✅ [CSV Validation] Validated group/row ${primaryRow._originalRowIndex}`);
          }

          // DUPLICATE DETECTION: Check for duplicate client names and booking ref numbers
          const duplicateWarnings: string[] = [];

          const clientNameLower = fullLead.clientName?.toLowerCase().trim();
          const bookingRefLower = fullLead.bookingRefNo?.toLowerCase().trim();
          const transactionIdLower = fullLead.transactionId?.toLowerCase().trim();

          // Check client name duplicates
          if (fullLead.clientName && fullLead.clientName !== 'N/A from CSV') {
            // Check against existing leads in DB
            if (existingClientNames.has(clientNameLower!)) {
              const existing = allLeads.find(l => l.clientName.toLowerCase().trim() === clientNameLower);

              // NEW LOGIC: If duplicate client but SAME booking ref (DO number) and DIFFERENT transaction ID (RT number), it's a batch, not an error.
              // However, 'existing' is a single lead. We need to check if that existing lead allows merging.
              // If we are currently IMPORTING a new row, and it matches an existing DB row by Client Name... 
              // We usually want to warn unless we are intentionally updating.

              // Refinement: The user says "if there is duplicate in client name then the RTnumber [Transaction] is difference and DO number [Booking Ref] is same then the RT tickets ase in one batch."
              // This implies we should have grouped them earlier if they had the same Booking Ref.
              // If they were NOT grouped (e.g. diff csv rows), we might be seeing them here sequentially.
              // But handleCsvImport groups by Booking Ref (DO number) BEFORE this function is called.

              // So if we are here, it means this lead represents a GROUP of rows with the same Booking Ref.
              // The duplicate check here is against *other* groups or *existing DB* leads.

              const isSameBookingRef = existing?.bookingRefNo?.toLowerCase().trim() === bookingRefLower;

              if (existing && isSameBookingRef) {
                // Same DO Number (Booking Ref) -> This is likely an update or a continuation of the same booking batch.
                // We should NOT flag this as a duplicate warning.
                console.log(`[CSV Import] Merging/Updating batch for existing booking ${existing.id} (Ref: ${existing.bookingRefNo})`);
              } else {
                const warning = `⚠️ DUPLICATE CLIENT NAME: "${fullLead.clientName}" already exists in booking ${existing?.id}`;
                duplicateWarnings.push(warning);
                console.warn(`[CSV Import] Row ${primaryRow._originalRowIndex}: ${warning}`);
              }
            }

            // Check against current batch being imported
            else if (batchClientNames.has(clientNameLower!)) {
              // In the current batch, we already saw this client.
              // Since we group by Booking Ref No, if we see the same client again, it must be under a DIFFERENT Booking Ref No (otherwise it would be in the same group).
              // So this IS a duplicate duplicate warning case (Same client, different booking ref).
              const warning = `⚠️ DUPLICATE CLIENT NAME: "${fullLead.clientName}" appears multiple times in this CSV (different Booking Refs)`;
              duplicateWarnings.push(warning);
              console.warn(`[CSV Import] Row ${primaryRow._originalRowIndex}: ${warning}`);
            } else {
              batchClientNames.add(clientNameLower!);
            }
          }

          // Check booking reference number duplicates
          if (fullLead.bookingRefNo && fullLead.bookingRefNo.trim() !== '') {
            if (existingBookingRefs.has(bookingRefLower!)) {
              // Same logic: If it exists, but we are just adding more tickets (different RT) to the SAME DO (Booking Ref)...
              // Actually, if the DO exists in DB, we are technically "updating" it.
              const existing = allLeads.find(l => l.bookingRefNo?.toLowerCase().trim() === bookingRefLower);

              // If strict duplicate check is needed, we warn. But for "batch", we might want to allow.
              const warning = `⚠️ DUPLICATE BOOKING REF: "${fullLead.bookingRefNo}" already exists in booking ${existing?.id}`;
              duplicateWarnings.push(warning);
              console.warn(`[CSV Import] Row ${primaryRow._originalRowIndex}: ${warning}`);
            } else if (batchBookingRefs.has(bookingRefLower!)) {
              // Should not happen if we grouped correctly, unless blank ref?
              const warning = `⚠️ DUPLICATE BOOKING REF: "${fullLead.bookingRefNo}" appears multiple times in this CSV`;
              duplicateWarnings.push(warning);
              console.warn(`[CSV Import] Row ${primaryRow._originalRowIndex}: ${warning}`);
            } else {
              batchBookingRefs.add(bookingRefLower!);
            }
          }

          // Check Transaction ID (RT Number) duplicates
          if (transactionIdLower && transactionIdLower !== '') {
            // Logic: RT number must be unique globally.

            // 1. Check DB
            const existingWithSameRT = allLeads.find(l => l.transactionId?.toLowerCase().trim() === transactionIdLower);
            if (existingWithSameRT) {
              const warning = `⚠️ DUPLICATE TICKET/RT NO: "${fullLead.transactionId}" already exists in booking ${existingWithSameRT.id}`;
              duplicateWarnings.push(warning);
              console.warn(`[CSV Import] Row ${primaryRow._originalRowIndex}: ${warning}`);
            }

            // 2. Check current batch (prevent 2 rows having same RT unless grouped?)
            // Note: If grouped, transactionIdForRow is single. This checks across DIFFERENT groups/leads in batch.
            // We can use a set for batchTransactionIds (need to define it first if not exists, but we can iterate newLeadsFromCsv)

            // Only flag if we strictly haven't seen it in batch?
            // Simplest: Just warn if DB has it.
          } else {
            // If NO Transaction ID provided, it should have been generated upstream.
            // Double check generation logic (already present in lines 729-739 of original file, ensure it runs).
            // If somehow empty here:
            // transactionIdForRow = ... (It is already assigned to fullLead.transactionId)
            if (!fullLead.transactionId) {
              const leadYear = fullLead.month ? getFullYear(parseISO(fullLead.month)) : new Date().getFullYear();
              const currentMax = batchMaxTransactionNumbersByYear[leadYear] || 0;
              const newTx = generateNewLeadTransactionId(allLeads, leadYear, currentMax);
              fullLead.transactionId = newTx;

              // Update batch checker
              const numPart = parseInt(newTx.slice(newTx.lastIndexOf('-') + 1), 10);
              if (!isNaN(numPart)) batchMaxTransactionNumbersByYear[leadYear] = numPart;

              console.log(`[CSV Import] Generated Missing Transaction ID: ${newTx} for Row ${primaryRow._originalRowIndex}`);
            }
          }

          // Add duplicate warnings to notes if any found
          if (duplicateWarnings.length > 0) {
            const duplicateNote = `\n[DUPLICATE ALERT]: ${duplicateWarnings.join('; ')}`;
            fullLead.notes = (fullLead.notes || '') + duplicateNote;
          }
          // ========== END DUPLICATE DETECTION ==========

          const missingFields = [];
          if (!fullLead.clientName || fullLead.clientName === 'N/A from CSV') missingFields.push('clientName (missing or "N/A from CSV")');
          // if (!fullLead.agent) missingFields.push('agent'); // Relaxed validation as per user request
          if (!fullLead.yacht) missingFields.push('yacht');
          if (!fullLead.month) missingFields.push('month');
          // if (!fullLead.notes) missingFields.push('notes (mandatory)'); // Removed constraint


          if (missingFields.length > 0) {
            console.warn(`[CSV Import Bookings] Skipping booking at CSV row ${primaryRow._originalRowIndex} due to missing required fields: ${missingFields.join(', ')}. Booking data:`, JSON.parse(JSON.stringify(fullLead)));
            return null;
          }
          if (currentLeadIds.has(fullLead.id) || newLeadsFromCsv.some(l => l.id === fullLead.id)) {
            console.warn(`[CSV Import Bookings] Skipping booking with duplicate ID "${fullLead.id}" from CSV row ${primaryRow._originalRowIndex}.`);
            return null;
          }

          return fullLead;
        };

        // Create Leads from Groups
        bookingGroups.forEach((rows) => {
          const lead = processParsedRowToLead(rows, true);
          if (lead) newLeadsFromCsv.push(lead);
          else currentSkippedCount += rows.length;
        });

        // Create Leads from Ungrouped
        ungroupedRows.forEach(row => {
          const lead = processParsedRowToLead([row], false);
          if (lead) newLeadsFromCsv.push(lead);
          else currentSkippedCount++;
        });

        if (newLeadsFromCsv.length > 0) {
          setImportPreviewLeads(newLeadsFromCsv);
          setImportSkippedCount(currentSkippedCount);
          setIsShowingImportPreview(true);
          toast({ title: 'Preview Ready', description: `Parsed ${newLeadsFromCsv.length} bookings. Please review before confirming.` });
        } else {
          toast({ title: 'Import Finished', description: `No valid bookings found to import. ${currentSkippedCount} rows were skipped.`, variant: 'destructive' });
        }

      } catch (error) {
        console.error("CSV Parsing Error:", error);
        toast({ title: 'Import Error', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
      setIsImporting(false);
    }
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = async () => {
    if (importPreviewLeads.length === 0) return;
    setIsImporting(true);
    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    toast({ title: 'Finalizing Import', description: `Saving ${importPreviewLeads.length} bookings...` });

    for (const leadToImport of importPreviewLeads) {
      try {
        let payloadToSubmit: Partial<Lead> & { requestingUserId: string; requestingUserRole: string | null };
        const { id, ...rest } = leadToImport;
        // Strip temp ID if it was generated
        if (leadToImport.id.startsWith('imported-') || leadToImport.id.startsWith('temp-')) {
          payloadToSubmit = { ...rest, requestingUserId: currentUserId!, requestingUserRole: currentUserRole };
        } else {
          payloadToSubmit = { id, ...rest, requestingUserId: currentUserId!, requestingUserRole: currentUserRole };
        }

        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadToSubmit),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        console.error("Bulk save error:", e);
        failCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${successCount} bookings. ${failCount} failed. Took ${duration}s.`
    });

    setIsShowingImportPreview(false);
    setImportPreviewLeads([]);
    setIsImporting(false);
    fetchAllData();
  };

  const handlePrintDailyManifest = () => {
    if (filteredLeads.length === 0) {
      toast({ title: "No Bookings", description: "There are no bookings to print with the current filters.", variant: "default" });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: "Pop-up Blocked", description: "Please allow pop-ups to print the manifest.", variant: "destructive" });
      return; // Added missing return here
    }

    const title = startDate ? `Daily Manifest - ${format(startDate, 'dd MMM yyyy')}` : 'Bookings Manifest';

    // Helper to categorize items
    const categorizeBooking = (lead: Lead) => {
      const packageNames = lead.packageQuantities?.map(pq => pq.packageName.toUpperCase()) || [];
      // Assign highest tier found
      if (packageNames.some(n => n.includes('ROYAL'))) return 'ROYAL';
      if (packageNames.some(n => n.includes('VIP'))) return 'VIP';
      return 'STANDARD';
    };

    const royalLeads = filteredLeads.filter(l => categorizeBooking(l) === 'ROYAL');
    const vipLeads = filteredLeads.filter(l => categorizeBooking(l) === 'VIP');
    const standardLeads = filteredLeads.filter(l => categorizeBooking(l) === 'STANDARD');


    const generateTableHtml = (categoryTitle: string, leads: Lead[]) => {
      if (leads.length === 0) return '';
      return `
        <div class="category-section">
          <h2>${categoryTitle} (${leads.length})</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Client Name</th>
                <th>Agent Name</th>
                <th>Ticket Number</th>
                <th>Booking Ref</th>
                <th>Packs (Tickets)</th>
                <th>Date of Booking</th>
                <th>Date of Travel</th>
              </tr>
            </thead>
            <tbody>
              ${leads.map((lead, index) => {
        const packSummary = lead.packageQuantities?.map(pq => `${pq.quantity}x ${pq.packageName}`).join(', ') || '-';
        return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${lead.clientName || '-'}</td>
                    <td>${agentMap[lead.agent] || lead.agent || '-'}</td>
                    <td>${lead.transactionId || '-'}</td>
                    <td>${lead.bookingRefNo || '-'}</td>
                    <td>${packSummary}</td>
                    <td>${lead.createdAt ? format(parseISO(lead.createdAt), 'dd/MM/yyyy') : '-'}</td>
                    <td>${lead.month ? format(parseISO(lead.month), 'dd/MM/yyyy') : '-'}</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; color: #333; }
          .container { width: 100%; max-width: 100%; margin: 0 auto; }
          h1 { text-align: center; margin-bottom: 5px; }
          .meta { text-align: center; margin-bottom: 20px; font-size: 14px; color: #666; }
          
          .category-section { margin-bottom: 30px; page-break-inside: avoid; }
          h2 { border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; font-size: 16px; text-transform: uppercase; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background-color: #f2f2f2; font-weight: bold; font-size: 11px; }
          td { font-size: 11px; }
          
          @media print {
            @page { margin: 1cm; size: landscape; }
            body { -webkit-print-color-adjust: exact; }
            .category-section { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <div class="meta">
            Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}<br>
            Total Records: ${filteredLeads.length}
          </div>
          
          ${generateTableHtml('Royal Bookings', royalLeads)}
          ${generateTableHtml('VIP Bookings', vipLeads)}
          ${generateTableHtml('Standard Bookings', standardLeads)}
          
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      let leadEventDate: Date | null = null;
      try {
        if (lead.month && isValid(parseISO(lead.month))) {
          leadEventDate = parseISO(lead.month);
        }
      } catch (e) { console.warn(`Invalid month/event date for booking ${lead.id}: ${lead.month}`); }

      if (startDate && endDate && leadEventDate) {
        if (!isWithinInterval(leadEventDate, { start: startDate, end: endDate })) return false;
      } else if (startDate && leadEventDate) {
        if (leadEventDate < startDate) return false;
      } else if (endDate && leadEventDate) {
        if (leadEventDate > endDate) return false;
      }
      else if (!startDate && !endDate) {
      }

      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserIdFilter !== 'all' && (lead.lastModifiedByUserId !== selectedUserIdFilter && lead.ownerUserId !== selectedUserIdFilter)) return false;
      // const bookingStatuses = ['Balance', 'Deposit Paid', 'Full Payment', 'Check-in', 'Closed (Won)', 'Closed (Lost)', 'Cancelled'];
      // if (!bookingStatuses.includes(lead.status)) return false;

      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (paymentConfirmationStatusFilter !== 'all' && lead.paymentConfirmationStatus !== paymentConfirmationStatusFilter) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedYachtId, selectedAgentId, selectedUserIdFilter, statusFilter, paymentConfirmationStatusFilter]);

  const calculatedPackageCounts = useMemo(() => {
    const counts: CalculatedPackageCounts = {
      child: 0, adult: 0, childTopDeck: 0, adultTopDeck: 0, adultAlc: 0,
      vipChild: 0, vipAdult: 0, vipAlc: 0,
      royalChild: 0, royalAdult: 0, royalAlc: 0,
      basicSY: 0, standardSY: 0, premiumSY: 0, vipSY: 0,
      hourCharterPC: 0,
      others: 0,
    };

    const yachtCategoryMap = new Map<string, YachtCategory | undefined>();
    allYachts.forEach(y => yachtCategoryMap.set(y.id, y.category));

    filteredLeads.forEach(lead => {
      if (lead.packageQuantities) {
        lead.packageQuantities.forEach(pq => {
          const qty = pq.quantity || 0;
          if (qty === 0) return;

          const pkgNameUpper = pq.packageName.toUpperCase();

          const category = yachtCategoryMap.get(lead.yacht);

          if (category === 'Dinner Cruise' || category === 'Superyacht Sightseeing Cruise') {
            if (pkgNameUpper === 'CHILD') counts.child += qty;
            else if (pkgNameUpper === 'ADULT') counts.adult += qty;
            else if (pkgNameUpper.includes('CHILD TOP DECK')) counts.childTopDeck += qty;
            else if (pkgNameUpper.includes('ADULT TOP DECK')) counts.adultTopDeck += qty;
            else if (pkgNameUpper === 'ADULT ALC' || pkgNameUpper === 'ADULT ALCOHOLIC') counts.adultAlc += qty;
            else if (pkgNameUpper === 'VIP CHILD') counts.vipChild += qty;
            else if (pkgNameUpper === 'VIP ADULT') counts.vipAdult += qty;
            else if (pkgNameUpper.includes('VIP') && (pkgNameUpper.includes('ALC') || pkgNameUpper.includes('ALCOHOLIC'))) counts.vipAlc += qty;
            else if (pkgNameUpper === 'ROYAL CHILD') counts.royalChild += qty;
            else if (pkgNameUpper === 'ROYAL ADULT') counts.royalAdult += qty;
            else if (pkgNameUpper === 'ROYAL ALC') counts.royalAlc += qty;
            else if (pkgNameUpper === 'BASIC') counts.basicSY += qty;
            else if (pkgNameUpper === 'STANDARD') counts.standardSY += qty;
            else if (pkgNameUpper === 'PREMIUM') counts.premiumSY += qty;
            else if (pkgNameUpper === 'VIP') counts.vipSY += qty;
          } else if (category === 'Private Cruise') {
            if (pkgNameUpper === 'HOUR CHARTER') counts.hourCharterPC += qty;
          }
        });
      }
      if (lead.perTicketRate && lead.perTicketRate > 0) {
        counts.others += 1;
      }
    });
    return counts;
  }, [filteredLeads, allYachts]);


  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserIdFilter('all');
    setStatusFilter('all');
    setPaymentConfirmationStatusFilter('all');
    toast({ title: "Filters Reset", description: "Showing all bookings." });
  };

  const handleApplyFilters = () => {
    toast({ title: "Filters Applied", description: `Displaying ${filteredLeads.length} bookings based on current selections.` });
  };

  const calculateTotalGuestsFromPackageQuantitiesForExport = (lead: Lead): number => {
    if (!lead.packageQuantities || lead.packageQuantities.length === 0) return 0;
    return lead.packageQuantities.reduce((sum, pq) => sum + (Number(pq.quantity) || 0), 0);
  };

  const handleCsvExport = () => {
    if (filteredLeads.length === 0) {
      toast({ title: 'No Data', description: 'There are no bookings (matching current filters) to export.', variant: 'default' });
      return;
    }

    const dynamicColumns = generateBookingColumns(allYachts);

    const finalCsvHeaders = dynamicColumns
      .filter((col: BookingTableColumn) => col.accessorKey !== 'select' && col.accessorKey !== 'actions' && !col.isJsonDetails)
      .map((col: BookingTableColumn) => col.header);


    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) return '';
      let stringValue = String(cellData);
      if (String(cellData).trim() === '-' && typeof cellData === 'string') return '';
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const formatCurrencyForCsv = (amount?: number | null) => {
      if (amount === null || amount === undefined || isNaN(amount)) return '';
      return amount.toFixed(2);
    };

    const formatPercentageForCsv = (value?: number | null) => {
      if (typeof value !== 'number' || isNaN(value)) return '';
      return value.toFixed(1);
    };
    const formatNumericForCsv = (num?: number | null): string => {
      if (num === null || num === undefined || isNaN(num) || num === 0) {
        return '';
      }
      return String(num);
    };


    const csvRows = [
      finalCsvHeaders.join(','),
      ...filteredLeads.map(lead => {
        return dynamicColumns
          .filter((col: BookingTableColumn) => col.accessorKey !== 'select' && col.accessorKey !== 'actions' && !col.isJsonDetails)
          .map((col: BookingTableColumn) => {
            let cellValue: any;
            if (col.isPackageQuantityColumn && col.actualPackageName) {
              const pkgQuantityItem = lead.packageQuantities?.find(pq => pq.packageName === col.actualPackageName);
              const quantity = pkgQuantityItem?.quantity;
              cellValue = (quantity !== undefined && quantity > 0) ? String(quantity) : '';
            }
            else if (col.accessorKey === 'totalGuestsCalculated') {
              cellValue = calculateTotalGuestsFromPackageQuantitiesForExport(lead);
            } else if (col.accessorKey === 'averageRateCalculated') {
              const totalGuests = calculateTotalGuestsFromPackageQuantitiesForExport(lead);
              if (totalGuests > 0 && lead.totalAmount !== undefined && lead.totalAmount !== null) {
                const averageRate = lead.totalAmount / totalGuests;
                cellValue = formatCurrencyForCsv(averageRate);
              } else {
                cellValue = '';
              }
            } else if (col.isAgentLookup) {
              cellValue = agentMap[lead.agent as string] || lead.agent;
            } else if (col.isYachtLookup) {
              cellValue = yachtMap[lead.yacht as string] || lead.yacht;
            } else if (col.isUserLookup) {
              const userId = lead[col.accessorKey as keyof Lead] as string | undefined;
              cellValue = userId ? userMap[userId] || userId : '';
            } else if (col.isDate) {
              const dateVal = lead[col.accessorKey as keyof Lead] as string | undefined;
              cellValue = dateVal && isValid(parseISO(dateVal)) ? format(parseISO(dateVal), 'dd/MM/yyyy HH:mm') : '';
            } else if (col.isShortDate) {
              const dateVal = lead[col.accessorKey as keyof Lead] as string | undefined;
              cellValue = dateVal && isValid(parseISO(dateVal)) ? format(parseISO(dateVal), 'dd/MM/yyyy') : '';
            } else if (col.isCurrency) {
              cellValue = formatCurrencyForCsv(lead[col.accessorKey as keyof Lead] as number | null | undefined);
            } else if (col.isPercentage) {
              cellValue = formatPercentageForCsv(lead[col.accessorKey as keyof Lead] as number | null | undefined);
            } else if (col.accessorKey === 'freeGuestCount') {
              cellValue = formatNumericForCsv(lead.freeGuestCount);
            }
            else {
              cellValue = lead[col.accessorKey as keyof Lead];
            }

            if ((col.isPackageQuantityColumn || col.accessorKey === 'totalGuestsCalculated' || col.accessorKey === 'freeGuestCount') &&
              (cellValue === 0 || cellValue === undefined || cellValue === null || cellValue === '')) {
              return '';
            }
            if (col.accessorKey === 'perTicketRate' && (cellValue === null || cellValue === undefined)) {
              return '';
            }

            return escapeCsvCell(cellValue);
          })
          .join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'dutchoriental_bookings_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: 'Bookings have been exported to CSV.' });
    } else {
      toast({ title: 'Export Failed', description: 'Your browser does not support this feature.', variant: 'destructive' });
    }
  };

  const pageHeaderActions = (
    <div className="flex items-center gap-2">
      {selectedLeadIds.length > 0 && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isImporting}>
                Change Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Set status for selected ({selectedLeadIds.length})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {leadStatusOptions.map(status => (
                <DropdownMenuItem key={status} onSelect={() => handleChangeSelectedLeadsStatus(status)}>
                  Set to {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {canDelete && (
            <Button variant="destructive" onClick={handleDeleteSelectedLeads} disabled={isImporting}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected ({selectedLeadIds.length})
            </Button>
          )}
        </>
      )}
      <ImportExportButtons
        onAddBookingClick={handleAddBookingClick}
        onCsvImport={handleCsvImport}
        onCsvExport={handleCsvExport}
      />
      <Button variant="outline" onClick={handlePrintDailyManifest} disabled={isImporting}>
        <Printer className="mr-2 h-4 w-4" />
        Print Daily Manifest
      </Button>
    </div>
  );


  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Booking Management"
          description="Track and manage all your confirmed and active bookings."
          actions={
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Booking Management" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load essential data for this page: {fetchError}</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Booking Management"
        description="Track and manage all your confirmed and active bookings."
        actions={pageHeaderActions}
      />
      <div className="mb-6 p-4 border rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="start-date-leads">Start Date (Event)</Label>
            <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
          </div>
          <div>
            <Label htmlFor="end-date-leads">End Date (Event)</Label>
            <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" disabled={(date) => startDate ? date < startDate : false} />
          </div>
          <div>
            <Label htmlFor="status-filter-leads">Booking Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}>
              <SelectTrigger id="status-filter-leads" className="w-full">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {leadStatusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="payment-confirmation-status-filter-leads">Payment/Conf. Status</Label>
            <Select value={paymentConfirmationStatusFilter} onValueChange={(value) => setPaymentConfirmationStatusFilter(value as PaymentConfirmationStatus | 'all')}>
              <SelectTrigger id="payment-confirmation-status-filter-leads" className="w-full">
                <SelectValue placeholder="All Payment/Conf. Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment/Conf. Statuses</SelectItem>
                {paymentConfirmationStatusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="yacht-filter-leads">Yacht</Label>
            <Select value={selectedYachtId} onValueChange={setSelectedYachtId}>
              <SelectTrigger id="yacht-filter-leads"><SelectValue placeholder="All Yachts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Yachts</SelectItem>
                {allYachts.map(yacht => <SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="agent-filter-leads">Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger id="agent-filter-leads"><SelectValue placeholder="All Agents" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {allAgents.map(agent => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="user-filter-leads">User (Modified/Owner)</Label>
            <Select value={selectedUserIdFilter} onValueChange={setSelectedUserIdFilter}>
              <SelectTrigger id="user-filter-leads"><SelectValue placeholder="All Users" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {Object.entries(userMap).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Button onClick={resetFilters} variant="outline" className="w-full sm:w-auto">Reset Filters</Button>
          <Button onClick={handleApplyFilters} variant="default" className="w-full sm:w-auto">Apply Filters</Button>
        </div>

        <div className="mt-6 pt-4 border-t">
          <h3 className="text-md font-semibold mb-3 text-foreground">Filtered Bookings Package Summary:</h3>
          <div className="flex flex-wrap gap-3">
            {(Object.keys(calculatedPackageCounts) as Array<keyof CalculatedPackageCounts>)
              .filter(key => calculatedPackageCounts[key] > 0 || (key === 'others' && calculatedPackageCounts[key] >= 0))
              .map(key => {
                const label = packageCountLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return (
                  <div key={key} className="p-3 border rounded-lg bg-card shadow-sm text-center min-w-[120px]">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-bold text-primary">{calculatedPackageCounts[key]}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <DailyBookingsStats
        leads={allLeads}
        yachts={allYachts}
        date={startDate || new Date()}
        title={startDate ? "Daily Report (Selected Date)" : "Daily Report (Today)"}
      />
      <BookingsTable
        leads={filteredLeads}
        onEditLead={handleEditLeadClick}
        onDeleteLead={handleDeleteLead}
        onGenerateInvoice={handleGenerateInvoice}
        userMap={userMap}
        agentMap={agentMap}
        yachtMap={yachtMap}
        allYachts={allYachts}
        currentUserId={currentUserId}
        isAdmin={canBypassClosed}
        selectedLeadIds={selectedLeadIds}
        onSelectLead={handleSelectLead}
        onSelectAllLeads={handleSelectAllLeads}
      />
      <BookingFormDialog
        isOpen={isLeadDialogOpen}
        onOpenChange={setIsLeadDialogOpen}
        lead={editingLead}
        onSubmitSuccess={handleLeadFormSubmit}
        currentUserId={currentUserId}
        isAdmin={canBypassClosed}
        allUsers={allUsers}
      />

      <Dialog open={isShowingImportPreview} onOpenChange={setIsShowingImportPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Preview ({importPreviewLeads.length} Bookings Found)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {importSkippedCount > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {importSkippedCount} rows were skipped due to parsing errors or missing required data. Check console for details.
                    </AlertDescription>
                  </Alert>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref No.</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Yacht</TableHead>
                      <TableHead>Packages</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Total (AED)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importPreviewLeads.slice(0, 100).map((lead, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">{lead.bookingRefNo || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{lead.clientName}</TableCell>
                        <TableCell>{lead.month ? format(parseISO(lead.month), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{yachtMap[lead.yacht] || lead.yacht}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {lead.packageQuantities?.map((pq, pidx) => (
                              <Badge key={pidx} variant="secondary" className="text-[10px]">
                                {pq.quantity}x {pq.packageName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{agentMap[lead.agent] || lead.agent || 'Direct'}</TableCell>
                        <TableCell className="text-right font-bold">
                          {lead.totalAmount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {importPreviewLeads.length > 100 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground p-4">
                          ... and {importPreviewLeads.length - 100} more rows (hidden for performance)
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setIsShowingImportPreview(false);
              setImportPreviewLeads([]);
            }} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmBulkImport} disabled={isImporting}>
              {isImporting ? 'Importing...' : `Confirm & Import ${importPreviewLeads.length} Bookings`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
