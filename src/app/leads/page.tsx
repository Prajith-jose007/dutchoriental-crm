
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable, generateLeadColumns, type LeadTableColumn } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, User, Agent, Yacht, LeadType, LeadPackageQuantity, PaymentConfirmationStatus, YachtPackageItem, YachtCategory } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, paymentConfirmationStatusOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, isValid, formatISO, getYear as getFullYear, getMonth as getMonthIndex } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Trash2 } from 'lucide-react';


const USER_ID_STORAGE_KEY = 'currentUserId';
const USER_ROLE_STORAGE_KEY = 'currentUserRole';


const csvHeaderMapping: { [csvHeaderKey: string]: keyof Omit<Lead, 'packageQuantities'> | 'package_quantities_json_string' | `pkg_${string}` } = {
  'id': 'id',
  'status': 'status',
  'date': 'month', 'event_date': 'month', 'lead/event_date': 'month',
  'yacht': 'yacht', 'yacht_name': 'yacht',
  'agent': 'agent', 'agent_name': 'agent',
  'client': 'clientName', 'client_name': 'clientName',
  'payment_status': 'paymentConfirmationStatus', 'pay_status': 'paymentConfirmationStatus', 'payment_confirmation_status': 'paymentConfirmationStatus',
  'type': 'type', 'lead_type': 'type',
  'transaction_id': 'transactionId', 'transaction id': 'transactionId',
  'payment_mode': 'modeOfPayment', 'mode_of_payment': 'modeOfPayment',
  'free': 'freeGuestCount', 'free_guests': 'freeGuestCount',
  'ch': 'pkg_child',
  'ad': 'pkg_adult',
  'chd_top': 'pkg_child_top_deck', 'child_top_deck': 'pkg_child_top_deck',
  'adt_top': 'pkg_adult_top_deck', 'adult_top_deck': 'pkg_adult_top_deck',
  'ad_alc': 'pkg_adult_alc', 'adult_alc': 'pkg_adult_alc',
  'vip_ch': 'pkg_vip_child', 'vip_child': 'pkg_vip_child',
  'vip_ad': 'pkg_vip_adult', 'vip_adult': 'pkg_vip_adult',
  'vip_alc': 'pkg_vip_alc', 'vip_alc': 'pkg_vip_alc',
  'ryl_ch': 'pkg_royal_child', 'royal_child': 'pkg_royal_child',
  'ryl_ad': 'pkg_royal_adult', 'royal_adult': 'pkg_royal_adult',
  'ryl_alc': 'pkg_royal_alc', 'royal_alc': 'pkg_royal_alc',
  'basic': 'pkg_basic',
  'std': 'pkg_standard', 'standard': 'pkg_standard',
  'prem': 'pkg_premium', 'premium': 'pkg_premium',
  'vip': 'pkg_vip', // Added direct VIP mapping
  'hrchtr': 'pkg_hour_charter', 'hour_charter': 'pkg_hour_charter',
  'package_details_(json)': 'package_quantities_json_string', 'package_details_json': 'package_quantities_json_string',
  'other': 'perTicketRate', 'other_rate': 'perTicketRate',
  'total_amt': 'totalAmount', 'total_amount': 'totalAmount',
  'discount_%': 'commissionPercentage', 'discount_rate': 'commissionPercentage', 'discount': 'commissionPercentage',
  'commission': 'commissionAmount', 'commission_amount': 'commissionAmount',
  'net_amt': 'netAmount', 'net_amount': 'netAmount',
  'paid': 'paidAmount', 'paid_amount': 'paidAmount',
  'balance': 'balanceAmount', 'balance_amount': 'balanceAmount',
  'note': 'notes',
  'created_by': 'ownerUserId', 'created by': 'ownerUserId',
  'modified_by': 'lastModifiedByUserId', 'modified by': 'lastModifiedByUserId',
  'date_of_creation': 'createdAt', 'creation_date': 'createdAt',
  'date_of_modification': 'updatedAt', 'modification_date': 'updatedAt',
};


const convertCsvValue = (
    key: keyof Omit<Lead, 'packageQuantities'> | 'package_quantities_json_string' | `pkg_${string}`,
    value: string,
    allYachts: Yacht[],
    agentMap: { [id: string]: string },
    userMap: { [id: string]: string },
    yachtMap: { [id: string]: string }
  ): any => {
  const trimmedValue = value ? String(value).trim() : '';
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(USER_ID_STORAGE_KEY) : null;

  if (key.startsWith('pkg_')) {
    const num = parseInt(trimmedValue, 10);
    return isNaN(num) || num < 0 ? 0 : num;
  }
  if (key === 'package_quantities_json_string') {
    if (!trimmedValue) return null;
    try {
      const parsedJson = JSON.parse(trimmedValue);
      if (Array.isArray(parsedJson)) {
        return parsedJson.map(pq => ({
          packageId: String(pq.packageId || ''),
          packageName: String(pq.packageName || 'Unknown CSV Pkg'),
          quantity: Number(pq.quantity || 0),
          rate: Number(pq.rate || 0),
        })).filter(pq => pq.packageName);
      }
      return null;
    } catch (e) {
      console.warn(`[CSV Import Leads] Could not parse package_quantities_json_string: "${trimmedValue}". Error:`, e);
      return null;
    }
  }

  if (trimmedValue === '' || value === null || value === undefined) {
    switch (key) {
      case 'totalAmount': case 'commissionPercentage': case 'commissionAmount':
      case 'netAmount': case 'paidAmount': case 'balanceAmount':
      case 'freeGuestCount': return 0;
      case 'perTicketRate': return null;
      case 'modeOfPayment': return 'CARD';
      case 'status': return 'Upcoming'; 
      case 'type': return 'Private Cruise' as LeadType;
      case 'paymentConfirmationStatus': return 'UNPAID' as PaymentConfirmationStatus;
      case 'notes': return '';
      case 'month': return formatISO(new Date());
      case 'createdAt': case 'updatedAt': return formatISO(new Date());
      case 'lastModifiedByUserId': return currentUserId || undefined;
      case 'ownerUserId': return currentUserId || undefined;
      default: return undefined;
    }
  }

  switch (key) {
    case 'agent':
    case 'yacht':
    case 'ownerUserId':
    case 'lastModifiedByUserId':
      const mapToUse = key === 'agent' ? agentMap : (key === 'yacht' ? yachtMap : userMap);
      const idByName = Object.keys(mapToUse).find(id => mapToUse[id]?.toLowerCase() === trimmedValue.toLowerCase());
      return idByName || trimmedValue;

    case 'totalAmount': case 'commissionPercentage': case 'commissionAmount':
    case 'netAmount': case 'paidAmount': case 'balanceAmount':
    case 'freeGuestCount':
      const numFinancial = parseFloat(trimmedValue.replace(/,/g, ''));
      return isNaN(numFinancial) ? 0 : numFinancial;
    case 'perTicketRate':
        const numRate = parseFloat(trimmedValue.replace(/,/g, ''));
        return isNaN(numRate) ? null : numRate;

    case 'modeOfPayment':
      return modeOfPaymentOptions.includes(trimmedValue.toUpperCase() as ModeOfPayment) ? trimmedValue.toUpperCase() : 'CARD';
    case 'status':
      const lowerTrimmedStatusValue = trimmedValue.toLowerCase();
      const foundStatus = leadStatusOptions.find(opt => opt.toLowerCase() === lowerTrimmedStatusValue);
      return foundStatus || 'Upcoming'; 
    case 'type':
      return leadTypeOptions.includes(trimmedValue as LeadType) ? trimmedValue : 'Private Cruise';
    case 'paymentConfirmationStatus':
      const upperTrimmedPaymentStatus = trimmedValue.toUpperCase();
      if (paymentConfirmationStatusOptions.includes(upperTrimmedPaymentStatus as PaymentConfirmationStatus)) {
        return upperTrimmedPaymentStatus as PaymentConfirmationStatus;
      }
      if (upperTrimmedPaymentStatus === 'CONFIRMED') return 'PAY AT COUNTER'; 
      return 'UNPAID'; 

    case 'month':
    case 'createdAt':
    case 'updatedAt':
      try {
        const parsedISODate = parseISO(trimmedValue);
        if (isValid(parsedISODate)) return formatISO(parsedISODate);
      } catch (e) { /* ignore */ }

      try {
        let dateObj: Date | null = null;
        const dayMonthYearMatch = trimmedValue.match(/(?:(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day,\s*)?(\d{1,2})\s*(\w+)\s*(\d{4})/i) ||
                                  trimmedValue.match(/(\w+)\s*(\d{1,2})\s*(\d{4})/i);
        if (dayMonthYearMatch) {
            const dayStr = dayMonthYearMatch[dayMonthYearMatch.length === 4 ? 1 : 2];
            const monthStr = dayMonthYearMatch[dayMonthYearMatch.length === 4 ? 2 : 1];
            const yearStr = dayMonthYearMatch[dayMonthYearMatch.length -1];
            let day = parseInt(dayStr, 10);
            let year = parseInt(yearStr, 10);
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
            let monthIndex = monthNames.findIndex(m => monthStr.toLowerCase().startsWith(m));
            if (monthIndex === -1) {
                const monthNum = parseInt(monthStr, 10);
                if (monthNum >= 1 && monthNum <= 12) monthIndex = monthNum -1;
            }
            if (monthIndex > -1 && day >=1 && day <=31 && year > 1900 && year < 2100) {
                dateObj = new Date(Date.UTC(year, monthIndex, day));
            }
        }
        if (!dateObj || !isValid(dateObj)) {
            const parts = trimmedValue.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
            if (parts && parts.length === 4) {
                let day = parseInt(parts[1], 10);
                let month = parseInt(parts[2], 10);
                let year = parseInt(parts[3], 10);
                if (String(year).length === 2) year += 2000;
                if (month >=1 && month <=12 && day >=1 && day <=31) {
                    dateObj = new Date(Date.UTC(year, month - 1, day));
                }
                if ((!dateObj || !isValid(dateObj)) && day >=1 && day <=12 && month >=1 && month <=31) {
                    dateObj = new Date(Date.UTC(year, day - 1, month));
                }
            }
        }
        if (dateObj && isValid(dateObj)) return formatISO(dateObj);
      } catch (e) {/* ignore */ }
      console.warn(`[CSV Import] Could not parse date "${trimmedValue}" for key "${String(key)}". Defaulting to current date.`);
      return formatISO(new Date());
    default:
      return trimmedValue;
  }
};


function parseCsvLine(line: string): string[] {
  const columns: string[] = [];
  let currentColumn = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        currentColumn += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      columns.push(currentColumn.trim());
      currentColumn = '';
    } else {
      currentColumn += char;
    }
  }
  columns.push(currentColumn.trim());
  return columns;
}


function generateNewLeadId(existingLeadIds: string[]): string {
  const prefix = "DO-";
  let maxNum = 0;
  existingLeadIds.forEach(id => {
    if (id && id.startsWith(prefix)) {
      const numPart = parseInt(id.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

function generateNewLeadTransactionId(existingLeads: Lead[], forYear: number, currentMaxForYearInBatch: number = 0): string {
  const prefix = `TRN-${forYear}`;
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
  child: number;
  adult: number;
  childTopDeck: number;
  adultTopDeck: number;
  adultAlc: number;
  vipChild: number;
  vipAdult: number;
  vipAlc: number;
  royalChild: number;
  royalAdult: number;
  royalAlc: number;
  basicSY: number;
  standardSY: number;
  premiumSY: number;
  vipSY: number;
  hourCharterPC: number;
  others: number;
}

const packageCountLabels: Record<keyof CalculatedPackageCounts, string> = {
  child: 'CHILD',
  adult: 'ADULT',
  childTopDeck: 'CHILD TOP DECK',
  adultTopDeck: 'ADULT TOP DECK',
  adultAlc: 'ADULT ALC',
  vipChild: 'VIP CHILD',
  vipAdult: 'VIP ADULT',
  vipAlc: 'VIP ALC',
  royalChild: 'ROYAL CHILD',
  royalAdult: 'ROYAL ADULT',
  royalAlc: 'ROYAL ALC',
  basicSY: 'BASIC (SY)',
  standardSY: 'STANDARD (SY)',
  premiumSY: 'PREMIUM (SY)',
  vipSY: 'VIP (SY)',
  hourCharterPC: 'HOUR CHARTER (PC)',
  others: 'OTHERS (Rate)',
};


export default function LeadsPage() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
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
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);


  const fetchAllData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const [leadsRes, agentsRes, yachtsRes, usersRes ] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/agents'),
        fetch('/api/yachts'),
        fetch('/api/users'),
      ]);

      if (!leadsRes.ok) throw new Error(`Failed to fetch leads: ${leadsRes.statusText}`);
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
      const map: { [id: string]: string } = {};
      if (Array.isArray(usersData)) {
        usersData.forEach(user => { map[user.id] = user.name; });
      }
      setUserMap(map);

    } catch (error) {
      console.error("Error fetching initial data for Leads page:", error);
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
      const storedUserRole = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setCurrentUserId(storedUserId);
      setCurrentUserRole(storedUserRole);
      setIsAdmin(storedUserRole === 'admin');
    } catch (e) {
      console.error("Error accessing localStorage for user details:", e);
    }
    fetchAllData();
  }, []);

  const handleAddLeadClick = () => {
    setEditingLead(null);
    setIsLeadDialogOpen(true);
  };

  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleLeadFormSubmit = async (submittedLeadData: Lead) => {
    if (!currentUserId || !currentUserRole) {
      toast({ title: 'Authentication Error', description: 'User details not found. Please re-login.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const isNewLead = !editingLead || !submittedLeadData.id || submittedLeadData.id.startsWith('temp-');
    let finalTransactionId = submittedLeadData.transactionId;

    if (isNewLead && (!finalTransactionId || String(finalTransactionId).trim() === "" || finalTransactionId === "Pending Generation")) {
        const leadYear = submittedLeadData.month ? getFullYear(parseISO(submittedLeadData.month)) : new Date().getFullYear();
        finalTransactionId = generateNewLeadTransactionId(allLeads, leadYear);
    }


    const payload: Lead & { requestingUserId: string; requestingUserRole: string } = {
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

    if (isNewLead) {
      payload.ownerUserId = currentUserId;
      payload.createdAt = new Date().toISOString();
      if (payload.id && payload.id.startsWith('temp-')) {
         delete payload.id;
      } else if (!payload.id) {
         delete payload.id;
      }
    } else if (editingLead) {
      payload.ownerUserId = editingLead.ownerUserId || currentUserId;
      payload.createdAt = editingLead.createdAt || new Date().toISOString();
       if (editingLead.status === 'Closed' && !isAdmin) {
        toast({ title: "Action Denied", description: "Closed leads cannot be modified by non-administrators.", variant: "destructive" });
        setIsLoading(false);
        setIsLeadDialogOpen(false);
        setEditingLead(null);
        return;
      }
    }

    console.log("[LeadsPage] Submitting lead payload:", payload);

    try {
      let response;
      if (editingLead && payload.id === editingLead.id) {
        response = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        let descriptiveMessage = `API Error: ${response.status} ${response.statusText}`;
        let errorDetailsLog = '';
        try {
          const parsedError = await response.json();
          console.error("[LeadsPage] Parsed API error response from form submit:", parsedError);
          descriptiveMessage = parsedError.message || descriptiveMessage;
          errorDetailsLog = parsedError.errorDetails || parsedError.error || '';
        } catch (jsonError) {
          console.warn("[LeadsPage] API error response body was not valid JSON or was empty. Status:", response.status, "StatusText:", response.statusText, "JSON parse error:", jsonError);
        }
        const finalErrorMessage = descriptiveMessage + (errorDetailsLog ? ` - Details: ${errorDetailsLog}` : '');
        throw new Error(finalErrorMessage);
      }

      toast({
        title: editingLead ? 'Lead Updated' : 'Lead Added',
        description: `Lead for ${submittedLeadData.clientName} has been saved.`,
      });

      await fetchAllData();
      setIsLeadDialogOpen(false);
      setEditingLead(null);

    } catch (error) {
      console.error("[LeadsPage] Error saving lead:", error);
      toast({ title: 'Error Saving Lead', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!currentUserId || !currentUserRole) {
      toast({ title: 'Authentication Error', description: 'User details not found. Please re-login.', variant: 'destructive' });
      return;
    }
    const leadToDelete = allLeads.find(l => l.id === leadId);
    if (leadToDelete?.status === 'Closed' && !isAdmin) {
      toast({ title: "Action Denied", description: "Closed leads cannot be deleted by non-administrators.", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete lead ${leadId}? This action cannot be undone.`)) {
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
          errorData.details = parsedError.errorDetails || parsedError.error || '';
        } catch (jsonError) {
           console.warn("[LeadsPage] API error response on delete was not valid JSON or was empty.", jsonError);
        }
        console.error("[LeadsPage] API Delete Error response data (parsed or fallback):", errorData);
        throw new Error(errorData.message + (errorData.details ? ` - Details: ${errorData.details}` : ''));
      }
      toast({ title: 'Lead Deleted', description: `Lead ${leadId} has been deleted.` });
      await fetchAllData();
      setSelectedLeadIds(prev => prev.filter(id => id !== leadId));
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({ title: 'Error Deleting Lead', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
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
      toast({ title: 'No Leads Selected', description: 'Please select leads to change their status.', variant: 'destructive' });
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
      let toastDescription = `${updatedCount} lead(s) updated to ${newStatus}.`;
      if (failedCount > 0) {
        toastDescription += ` ${failedCount} lead(s) could not be updated due to permissions or status.`;
        console.warn("Bulk status update failures:", errors);
      }
      toast({ title: 'Status Update Complete', description: toastDescription });
      
      await fetchAllData();
      setSelectedLeadIds([]);

    } catch (error) {
      console.error("Error changing selected leads status:", error);
      toast({ title: 'Error Updating Statuses', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSelectedLeads = async () => {
    if (selectedLeadIds.length === 0) {
      toast({ title: "No Leads Selected", description: "Please select leads to delete.", variant: "destructive" });
      return;
    }
     if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can perform bulk delete.", variant: "destructive" });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} selected leads? This action cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {
      
      let successfulDeletes = 0;
      let failedDeletes = 0;

      for (const leadId of selectedLeadIds) {
         const leadToDelete = allLeads.find(l => l.id === leadId);
          if (leadToDelete?.status === 'Closed' && !isAdmin) { 
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
          const errorData = await response.json().catch(() => ({ message: `Failed to delete lead ${leadId}`}));
          console.warn(`Failed to delete lead ${leadId}: ${errorData.message}`);
        }
      }
      
      let toastDescription = `${successfulDeletes} leads deleted.`;
      if (failedDeletes > 0) {
        toastDescription += ` ${failedDeletes} leads could not be deleted.`;
      }
      toast({ title: 'Bulk Delete Complete', description: toastDescription });

      await fetchAllData();
      setSelectedLeadIds([]);

    } catch (error) {
      console.error("Error deleting selected leads:", error);
      toast({ title: 'Error Deleting Leads', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  const handleCsvImport = async (file: File) => {
    if (!currentUserId) {
      toast({ title: 'Error', description: 'Current user ID not found. Cannot set owner for imported leads.', variant: 'destructive' });
      return;
    }
    setIsImporting(true);
    toast({ title: 'Import Started', description: 'Processing CSV file... This may take a few moments.' });
    const startTime = Date.now();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      let successCount = 0;
      let skippedCount = 0;

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
        const fileHeaders = parseCsvLine(headerLine).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        console.log("[CSV Import Leads] Detected Normalized Headers:", fileHeaders);

        const newLeadsFromCsv: Lead[] = [];
        const currentLeadIds = new Set(allLeads.map(l => l.id));

        const packageReverseHeaderMap: { [shortHeader: string]: string } = {};
        Object.entries(csvHeaderMapping).forEach(([csvKey, internalKey]) => {
            if (internalKey && internalKey.startsWith('pkg_')) {
                const actualPackageName = internalKey.substring('pkg_'.length).replace(/_/g, ' ').toUpperCase();
                packageReverseHeaderMap[csvKey] = actualPackageName;
            }
        });

        const batchMaxTransactionNumbersByYear: { [year: number]: number } = {};

        for (let i = 1; i < lines.length; i++) {
          let data = parseCsvLine(lines[i]);

          if (data.length > fileHeaders.length) {
            const extraColumns = data.slice(fileHeaders.length);
            const allExtraAreEmpty = extraColumns.every(col => (col || '').trim() === '');
            if (allExtraAreEmpty) {
              data = data.slice(0, fileHeaders.length);
            }
          }

          if (data.length !== fileHeaders.length) {
            console.warn(`[CSV Import Leads] Skipping malformed CSV line ${i + 1}: Expected ${fileHeaders.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            skippedCount++;
            continue;
          }

          const parsedRow = {} as Partial<Lead & { package_quantities_json_string?: LeadPackageQuantity[] } & { [key: `pkg_${string}`]: number }>;
          fileHeaders.forEach((fileHeader, index) => {
            const leadKey = csvHeaderMapping[fileHeader];
            if (leadKey) {
                (parsedRow as any)[leadKey] = convertCsvValue(leadKey, data[index], allYachts, agentMap, userMap, yachtMap);
            } else {
                console.warn(`[CSV Import Leads] Unknown header "${fileHeader}" (normalized: ${fileHeader}) in CSV row ${i+1}. Skipping this column.`);
            }
          });

          let packageQuantities: LeadPackageQuantity[] = [];
          if (parsedRow.package_quantities_json_string && Array.isArray(parsedRow.package_quantities_json_string)) {
            packageQuantities = parsedRow.package_quantities_json_string;
          } else {
            const leadYachtId = parsedRow.yacht || '';
            const yachtForLead = allYachts.find(y => y.id === leadYachtId || y.name.toLowerCase() === String(leadYachtId).toLowerCase());

            if (yachtForLead && yachtForLead.packages) {
                fileHeaders.forEach(csvHeaderKey => {
                    const internalKey = csvHeaderMapping[csvHeaderKey];
                    if (internalKey && internalKey.startsWith('pkg_')) {
                        const actualPackageName = packageReverseHeaderMap[csvHeaderKey];
                        const quantity = (parsedRow as any)[internalKey] as number | undefined;

                        if (actualPackageName && quantity !== undefined && quantity > 0) {
                            const yachtPackage = yachtForLead.packages.find(p => p.name.toUpperCase() === actualPackageName.toUpperCase());
                            if (yachtPackage) {
                                packageQuantities.push({
                                    packageId: yachtPackage.id,
                                    packageName: yachtPackage.name,
                                    quantity: quantity,
                                    rate: yachtPackage.rate,
                                });
                            } else {
                               console.warn(`[CSV Import] Package "${actualPackageName}" from CSV not found on yacht "${yachtForLead.name}". Skipping package for this lead.`);
                            }
                        }
                    }
                });
            }
          }

          const leadYear = parsedRow.month ? getFullYear(parseISO(parsedRow.month)) : new Date().getFullYear();
          let transactionIdForRow = parsedRow.transactionId;
          if (!transactionIdForRow || String(transactionIdForRow).trim() === '') {
            const currentMaxForYearInBatch = batchMaxTransactionNumbersByYear[leadYear] || 0;
            transactionIdForRow = generateNewLeadTransactionId(allLeads, leadYear, currentMaxForYearInBatch);
            const numPart = parseInt(transactionIdForRow.substring(transactionIdForRow.indexOf('-') + 1 + 4), 10);
            if (!isNaN(numPart)) {
                batchMaxTransactionNumbersByYear[leadYear] = numPart;
            }
          }

          const fullLead: Lead = {
            id: parsedRow.id || `imported-lead-${Date.now()}-${i}`,
            clientName: parsedRow.clientName || 'N/A from CSV',
            agent: parsedRow.agent || '',
            yacht: parsedRow.yacht || '',
            status: parsedRow.status || 'Upcoming', 
            month: parsedRow.month || formatISO(new Date()),
            notes: parsedRow.notes || '', // Ensure notes is not undefined for mandatory check
            type: parsedRow.type || 'Private Cruise',
            paymentConfirmationStatus: parsedRow.paymentConfirmationStatus || 'UNPAID',
            transactionId: transactionIdForRow,
            modeOfPayment: parsedRow.modeOfPayment || 'CARD',
            packageQuantities: packageQuantities,
            freeGuestCount: parsedRow.freeGuestCount || 0,
            perTicketRate: parsedRow.perTicketRate !== undefined && parsedRow.perTicketRate !== null ? Number(parsedRow.perTicketRate) : undefined,
            totalAmount: parsedRow.totalAmount ?? 0,
            commissionPercentage: parsedRow.commissionPercentage ?? 0,
            commissionAmount: parsedRow.commissionAmount ?? 0,
            netAmount: parsedRow.netAmount ?? 0,
            paidAmount: parsedRow.paidAmount ?? 0,
            balanceAmount: parsedRow.balanceAmount ?? 0,
            createdAt: parsedRow.createdAt || formatISO(new Date()),
            updatedAt: formatISO(new Date()),
            lastModifiedByUserId: currentUserId,
            ownerUserId: parsedRow.ownerUserId || currentUserId,
          };

          const missingFields = [];
          if (!fullLead.clientName || fullLead.clientName === 'N/A from CSV') missingFields.push('clientName (missing or "N/A from CSV")');
          if (!fullLead.agent) missingFields.push('agent');
          if (!fullLead.yacht) missingFields.push('yacht');
          if (!fullLead.month) missingFields.push('month');
          if (!fullLead.notes) missingFields.push('notes (mandatory)');


          if (missingFields.length > 0) {
             console.warn(`[CSV Import Leads] Skipping lead at CSV row ${i+1} due to missing required fields: ${missingFields.join(', ')}. Lead data:`, JSON.parse(JSON.stringify(fullLead)));
             skippedCount++;
             continue;
          }
          if (currentLeadIds.has(fullLead.id) || newLeadsFromCsv.some(l => l.id === fullLead.id)) {
             console.warn(`[CSV Import Leads] Skipping lead with duplicate ID "${fullLead.id}" from CSV row ${i+1}.`);
             skippedCount++;
             continue;
          }

          newLeadsFromCsv.push(fullLead);
        }

        if (newLeadsFromCsv.length > 0) {
          for (const leadToImport of newLeadsFromCsv) {
            try {
              const payload = { ...leadToImport, requestingUserId: currentUserId, requestingUserRole: currentUserRole };
              if (payload.id.startsWith('imported-lead-')) {
                delete payload.id;
              }

              const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              if (response.ok) {
                successCount++;
              } else {
                const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
                console.warn(`[CSV Import Leads] API Error for lead client ${leadToImport.clientName} (ID: ${leadToImport.id}): ${errorData.message || response.statusText}. Payload:`, payload);
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`[CSV Import Leads] Network/JS Error importing lead client ${leadToImport.clientName} (ID: ${leadToImport.id}):`, apiError, "Payload:", leadToImport);
                skippedCount++;
            }
          }
        }
      } catch (error) {
        console.error("CSV Parsing Error:", error);
        toast({ title: 'Import Error', description: (error as Error).message, variant: 'destructive' });
      } finally {
        const endTime = Date.now();
        const durationInSeconds = ((endTime - startTime) / 1000).toFixed(2);
        if (successCount > 0 || skippedCount > 0) {
            await fetchAllData();
        }
        toast({
            title: 'Import Processed',
            description: `${successCount} leads imported. ${skippedCount} rows skipped. Processed in ${durationInSeconds} seconds. Check console for details on skipped rows.`
        });
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
        setIsImporting(false);
    }
    reader.readAsText(file);
  };

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      let leadEventDate: Date | null = null;
      try {
        if (lead.month && isValid(parseISO(lead.month))) {
          leadEventDate = parseISO(lead.month);
        }
      } catch (e) { console.warn(`Invalid month/event date for lead ${lead.id}: ${lead.month}`); }

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
      if (selectedUserIdFilter !== 'all' && (lead.lastModifiedByUserId !== selectedUserIdFilter && lead.ownerUserId !== selectedUserIdFilter) ) return false;
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
      const leadYachtCategory = yachtCategoryMap.get(lead.yacht);

      if (lead.packageQuantities) {
        lead.packageQuantities.forEach(pq => {
          const qty = pq.quantity || 0;
          if (qty === 0) return;

          const pkgNameUpper = pq.packageName.toUpperCase();

          if (pkgNameUpper === 'CHILD') counts.child += qty;
          else if (pkgNameUpper === 'ADULT') counts.adult += qty;
          else if (pkgNameUpper === 'CHILD TOP DECK') counts.childTopDeck += qty;
          else if (pkgNameUpper === 'ADULT TOP DECK') counts.adultTopDeck += qty;
          else if (pkgNameUpper === 'ADULT ALC') counts.adultAlc += qty;
          else if (pkgNameUpper === 'VIP CHILD') counts.vipChild += qty;
          else if (pkgNameUpper === 'VIP ADULT') counts.vipAdult += qty;
          else if (pkgNameUpper === 'VIP ALC') counts.vipAlc += qty;
          else if (pkgNameUpper === 'ROYAL CHILD') counts.royalChild += qty;
          else if (pkgNameUpper === 'ROYAL ADULT') counts.royalAdult += qty;
          else if (pkgNameUpper === 'ROYAL ALC') counts.royalAlc += qty;
          else if (pkgNameUpper === 'BASIC' && leadYachtCategory === 'Superyacht Sightseeing Cruise') counts.basicSY += qty;
          else if (pkgNameUpper === 'STANDARD' && leadYachtCategory === 'Superyacht Sightseeing Cruise') counts.standardSY += qty;
          else if (pkgNameUpper === 'PREMIUM' && leadYachtCategory === 'Superyacht Sightseeing Cruise') counts.premiumSY += qty;
          else if (pkgNameUpper === 'VIP' && leadYachtCategory === 'Superyacht Sightseeing Cruise') counts.vipSY += qty;
          else if (pkgNameUpper === 'HOUR CHARTER' && leadYachtCategory === 'Private Cruise') counts.hourCharterPC += qty;
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
    toast({title: "Filters Reset", description: "Showing all leads."});
  };

  const handleApplyFilters = () => {
    toast({title: "Filters Applied", description: `Displaying ${filteredLeads.length} leads based on current selections.`});
  };

  const handleCsvExport = () => {
    if (filteredLeads.length === 0) {
      toast({ title: 'No Data', description: 'There are no leads (matching current filters) to export.', variant: 'default' });
      return;
    }

    const dynamicColumns = generateLeadColumns(allYachts);

    const finalCsvHeaders = dynamicColumns
      .filter(col => col.accessorKey !== 'select' && col.accessorKey !== 'actions')
      .map(col => {
          if (col.isPackageColumn && col.actualPackageName) {
             return col.header;
          }
          return col.header;
      });


    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) return '';
      let stringValue = String(cellData);
      if (String(cellData).trim() === '-' && typeof cellData === 'string') return '';
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const calculateTotalGuestsFromPackageQuantities = (lead: Lead): number => {
      if (!lead.packageQuantities || lead.packageQuantities.length === 0) return 0;
      return lead.packageQuantities.reduce((sum, pq) => sum + (Number(pq.quantity) || 0), 0);
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
          .filter(col => col.accessorKey !== 'select' && col.accessorKey !== 'actions')
          .map(col => {
            let cellValue: any;
            if (col.isJsonDetails) {
                cellValue = lead.packageQuantities ? JSON.stringify(lead.packageQuantities) : '[]';
            }
            else if (col.isPackageColumn && col.actualPackageName) {
              const pkgQuantityItem = lead.packageQuantities?.find(pq => pq.packageName === col.actualPackageName);
              const quantity = pkgQuantityItem?.quantity;
              const rate = pkgQuantityItem?.rate;
              if (quantity !== undefined && quantity > 0 && rate !== undefined) {
                cellValue = `${quantity} @ ${rate.toFixed(2)}`;
              } else {
                cellValue = '';
              }
            } else if (col.accessorKey === 'totalGuestsCalculated') {
              cellValue = calculateTotalGuestsFromPackageQuantities(lead);
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

            if ( (col.isPackageColumn || col.accessorKey === 'totalGuestsCalculated' || col.accessorKey === 'freeGuestCount') &&
                 (cellValue === 0 || cellValue === undefined || cellValue === null) ) {
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
      link.setAttribute('download', 'dutchoriental_leads_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Export Successful', description: 'Leads have been exported to CSV.' });
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
          {isAdmin && (
             <Button variant="destructive" onClick={handleDeleteSelectedLeads} disabled={isImporting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedLeadIds.length})
              </Button>
          )}
        </>
      )}
      <ImportExportButtons
        onAddLeadClick={handleAddLeadClick}
        onCsvImport={handleCsvImport}
        onCsvExport={handleCsvExport}
      />
    </div>
  );


  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="Leads Management"
          description="Track and manage all your sales leads."
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
        <PageHeader title="Leads Management" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load essential data for this page: {fetchError}</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Leads Management"
        description="Track and manage all your sales leads."
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
            <Label htmlFor="status-filter-leads">Lead Status</Label>
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
            <h3 className="text-md font-semibold mb-3 text-foreground">Filtered Leads Package Summary:</h3>
            <div className="flex flex-wrap gap-3">
                {(Object.keys(calculatedPackageCounts) as Array<keyof CalculatedPackageCounts>)
                  .filter(key => calculatedPackageCounts[key] > 0 || (key === 'others' && calculatedPackageCounts[key] >= 0) ) 
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

      <LeadsTable
        leads={filteredLeads}
        onEditLead={handleEditLeadClick}
        onDeleteLead={handleDeleteLead}
        userMap={userMap}
        agentMap={agentMap}
        yachtMap={yachtMap}
        allYachts={allYachts}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        selectedLeadIds={selectedLeadIds}
        onSelectLead={handleSelectLead}
        onSelectAllLeads={handleSelectAllLeads}
      />

      {isLeadDialogOpen && (
        <LeadFormDialog
          isOpen={isLeadDialogOpen}
          onOpenChange={setIsLeadDialogOpen}
          lead={editingLead}
          onSubmitSuccess={handleLeadFormSubmit}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

