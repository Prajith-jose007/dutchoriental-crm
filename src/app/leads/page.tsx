
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, User, Agent, Yacht, LeadType, LeadPackageQuantity, PaymentConfirmationStatus } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions, paymentConfirmationStatusOptions } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, isValid, formatISO, getYear as getFullYear, getMonth as getMonthIndex } from 'date-fns';

const SIMULATED_CURRENT_USER_ID = 'DO-user1';

// Updated CSV Header Mapping
const csvHeaderMapping: { [csvHeaderKey: string]: keyof Omit<Lead, 'packageQuantities'> | 'package_quantities_json' } = {
  'id': 'id',
  'clientname': 'clientName', 'client name': 'clientName',
  'agent': 'agent', 'agentid': 'agent',
  'yacht': 'yacht', 'yachtid': 'yacht',
  'status': 'status',
  'month': 'month', 'lead/event date': 'month',
  'notes': 'notes', 'user feed': 'notes',
  'type': 'type', 'lead type': 'type',
  'paymentconfirmationstatus': 'paymentConfirmationStatus', 'payment confirmation status': 'paymentConfirmationStatus', 
  'transactionid': 'transactionId', 'transaction id': 'transactionId',
  'modeofpayment': 'modeOfPayment', 'payment mode': 'modeOfPayment',

  'package_quantities_json': 'package_quantities_json', // For import only

  'totalamount': 'totalAmount',
  'commissionpercentage': 'commissionPercentage',
  'commissionamount': 'commissionAmount',
  'netamount': 'netAmount',
  'paidamount': 'paidAmount',
  'balanceamount': 'balanceAmount',
  'createdat': 'createdAt',
  'updatedat': 'updatedAt',
  'lastmodifiedbyuserid': 'lastModifiedByUserId',
  'owneruserid': 'ownerUserId',
};

const convertCsvValue = (key: keyof Omit<Lead, 'packageQuantities'> | 'package_quantities_json', value: string): any => {
  const trimmedValue = value ? String(value).trim() : '';

  if (trimmedValue === '' || value === null || value === undefined) {
    switch (key) {
      case 'totalAmount': case 'commissionPercentage':
      case 'commissionAmount': case 'netAmount': case 'paidAmount': case 'balanceAmount':
        return 0;
      case 'modeOfPayment': return 'Online';
      case 'status': return 'Balance'; 
      case 'type': return 'Private Cruise' as LeadType;
      case 'paymentConfirmationStatus': return 'CONFIRMED' as PaymentConfirmationStatus; 
      case 'notes': return '';
      case 'month': return formatISO(new Date());
      case 'createdAt': case 'updatedAt': return formatISO(new Date());
      case 'package_quantities_json': return null;
      default: return undefined;
    }
  }

  switch (key) {
    case 'totalAmount': case 'commissionPercentage':
    case 'commissionAmount': case 'netAmount': case 'paidAmount': case 'balanceAmount':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? 0 : num;
    case 'modeOfPayment':
      return modeOfPaymentOptions.includes(trimmedValue as ModeOfPayment) ? trimmedValue : 'Online';
    case 'status':
      return leadStatusOptions.includes(trimmedValue as LeadStatus) ? trimmedValue : 'Balance';
    case 'type':
      return leadTypeOptions.includes(trimmedValue as LeadType) ? trimmedValue : 'Private Cruise';
    case 'paymentConfirmationStatus': 
      return paymentConfirmationStatusOptions.includes(trimmedValue.toUpperCase() as PaymentConfirmationStatus) ? trimmedValue.toUpperCase() : 'CONFIRMED';
    case 'month':
    case 'createdAt':
    case 'updatedAt':
      try {
        const parsedDate = parseISO(trimmedValue);
        if (isValid(parsedDate)) return formatISO(parsedDate);
      } catch (e) { /* ignore ISO parse error */ }

      try {
        const parts = trimmedValue.split(/[\/\-\.]/);
        if (parts.length === 3) {
            let day = parseInt(parts[0]);
            let month = parseInt(parts[1]);
            let year = parseInt(parts[2]);
            if (String(year).length === 2) year += 2000;

            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100 && month >=1 && month <=12 && day >=1 && day <=31) {
                 const dateObj = new Date(year, month - 1, day);
                 if (isValid(dateObj)) return formatISO(dateObj);
            }
        }
      } catch (e) {/* ignore */ }
      console.warn(`[CSV Import] Could not parse date "${trimmedValue}" for key "${String(key)}". Defaulting to current date.`);
      return formatISO(new Date());
    case 'package_quantities_json':
      try {
        const parsed = JSON.parse(trimmedValue);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        console.warn(`[CSV Import] Could not parse package_quantities_json: "${trimmedValue}". Defaulting to null.`);
        return null;
      }
    default:
      return trimmedValue;
  }
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
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);

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
    setIsLoading(true);
    const payload: Lead = {
      ...submittedLeadData,
      lastModifiedByUserId: SIMULATED_CURRENT_USER_ID,
      updatedAt: new Date().toISOString(),
      month: submittedLeadData.month ? formatISO(parseISO(submittedLeadData.month)) : formatISO(new Date()),
      paymentConfirmationStatus: submittedLeadData.paymentConfirmationStatus,
      packageQuantities: submittedLeadData.packageQuantities?.map(pq => ({
        ...pq,
        quantity: Number(pq.quantity || 0),
        rate: Number(pq.rate || 0)
      })) || []
    };

    if (!editingLead) {
      payload.ownerUserId = SIMULATED_CURRENT_USER_ID;
      payload.createdAt = new Date().toISOString();
      delete payload.id;
    } else {
      payload.ownerUserId = editingLead.ownerUserId || SIMULATED_CURRENT_USER_ID;
      payload.createdAt = editingLead.createdAt || new Date().toISOString();
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
        let errorData = { message: `API Error: ${response.status} ${response.statusText}`, details: '' };
        try {
          const parsedError = await response.json();
          errorData.message = parsedError.message || errorData.message;
          errorData.details = parsedError.errorDetails || parsedError.error || '';
        } catch (jsonError) {
          console.warn("[LeadsPage] API error response was not valid JSON or was empty.", jsonError);
        }
        console.error("[LeadsPage] API Error response data (parsed or fallback):", errorData);
        throw new Error(errorData.message + (errorData.details ? ` - Details: ${errorData.details}` : ''));
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
    if (!confirm(`Are you sure you want to delete lead ${leadId}? This action cannot be undone.`)) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
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
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({ title: 'Error Deleting Lead', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvImport = async (file: File) => {
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
        const fileHeaders = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
        console.log("[CSV Import Leads] Detected Normalized Headers:", fileHeaders);

        const newLeadsFromCsv: Lead[] = [];
        const currentLeadIds = new Set(allLeads.map(l => l.id));

        for (let i = 1; i < lines.length; i++) {
          let data = lines[i].split(',');
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

          const parsedRow = {} as Partial<Lead & { package_quantities_json?: string }>;
          fileHeaders.forEach((fileHeader, index) => {
            const leadKey = csvHeaderMapping[fileHeader];
            if (leadKey) {
                (parsedRow as any)[leadKey] = convertCsvValue(leadKey, data[index]);
            } else {
                console.warn(`[CSV Import Leads] Unknown header "${fileHeader}" in CSV row ${i+1}. Skipping this column.`);
            }
          });
          if (i <= 2) console.log(`[CSV Import Leads] Processing Row ${i} - Parsed:`, JSON.parse(JSON.stringify(parsedRow)));

          let packageQuantities: LeadPackageQuantity[] = [];
          if (parsedRow.package_quantities_json) {
            try {
              const parsedPQs = JSON.parse(parsedRow.package_quantities_json);
              if (Array.isArray(parsedPQs)) {
                packageQuantities = parsedPQs.map(pq => ({
                  packageId: String(pq.packageId || ''),
                  packageName: String(pq.packageName || 'Unknown CSV Pkg'),
                  quantity: Number(pq.quantity || 0),
                  rate: Number(pq.rate || 0),
                }));
              }
            } catch (e) {
              console.warn(`[CSV Import Leads] Error parsing package_quantities_json from CSV for row ${i+1}: ${parsedRow.package_quantities_json}`);
            }
          }

          const fullLead: Lead = {
            id: parsedRow.id || `imported-lead-${Date.now()}-${i}`,
            clientName: parsedRow.clientName || 'N/A from CSV',
            agent: parsedRow.agent || '',
            yacht: parsedRow.yacht || '',
            status: parsedRow.status || 'Balance',
            month: parsedRow.month || formatISO(new Date()),
            notes: parsedRow.notes || undefined,
            type: parsedRow.type || 'Private Cruise',
            paymentConfirmationStatus: parsedRow.paymentConfirmationStatus || 'CONFIRMED', 
            transactionId: parsedRow.transactionId || undefined,
            modeOfPayment: parsedRow.modeOfPayment || 'Online',
            packageQuantities: packageQuantities,
            totalAmount: parsedRow.totalAmount ?? 0,
            commissionPercentage: parsedRow.commissionPercentage ?? 0,
            commissionAmount: parsedRow.commissionAmount ?? 0,
            netAmount: parsedRow.netAmount ?? 0,
            paidAmount: parsedRow.paidAmount ?? 0,
            balanceAmount: parsedRow.balanceAmount ?? 0,
            createdAt: parsedRow.createdAt || formatISO(new Date()),
            updatedAt: formatISO(new Date()),
            lastModifiedByUserId: SIMULATED_CURRENT_USER_ID,
            ownerUserId: parsedRow.ownerUserId || SIMULATED_CURRENT_USER_ID,
          };
          if (i <= 2) console.log(`[CSV Import Leads] Processing Row ${i} - Full Lead:`, JSON.parse(JSON.stringify(fullLead)));

          if (!fullLead.clientName || !fullLead.agent || !fullLead.yacht || !fullLead.month) {
             console.warn(`[CSV Import Leads] Skipping lead due to missing required fields (clientName, agent, yacht, month/event date) at CSV row ${i+1}. Lead data:`, fullLead);
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
              const payload = { ...leadToImport };
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
                console.warn(`[CSV Import Leads] API Error for lead client ${leadToImport.clientName}: ${errorData.message || response.statusText}. Payload:`, payload);
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`[CSV Import Leads] Network/JS Error importing lead client ${leadToImport.clientName}:`, apiError, "Payload:", leadToImport);
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
        // If no date range, this lead passes the date filter part unless specific month/year filters apply
      }

      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && (lead.lastModifiedByUserId !== selectedUserId && lead.ownerUserId !== selectedUserId) ) return false;
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (paymentConfirmationStatusFilter !== 'all' && lead.paymentConfirmationStatus !== paymentConfirmationStatusFilter) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedYachtId, selectedAgentId, selectedUserId, statusFilter, paymentConfirmationStatusFilter]);

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
    setStatusFilter('all');
    setPaymentConfirmationStatusFilter('all');
  };

  const handleCsvExport = () => {
    if (filteredLeads.length === 0) {
      toast({ title: 'No Data', description: 'There are no leads (matching current filters) to export.', variant: 'default' });
      return;
    }

    const preferredPackageMap: { header: string; dataName: string }[] = [
      { header: 'CH', dataName: 'CHILD' },
      { header: 'AD', dataName: 'ADULT' },
      { header: 'AD ALC', dataName: 'AD ALC' },
      { header: 'VIP CH', dataName: 'VIP CH' },
      { header: 'VIP AD', dataName: 'VIP AD' },
      { header: 'VIP ALC', dataName: 'VIP ALC' },
      { header: 'ROYAL CH', dataName: 'ROYAL CH' },
      { header: 'ROYAL AD', dataName: 'ROYAL AD' },
      { header: 'ROYAL ALC', dataName: 'ROYAL ALC' },
    ];
  
    const allActualUniquePackageNamesFromYachts = Array.from(
      new Set(
        allYachts.flatMap(yacht => yacht.packages?.map(pkg => pkg.name.trim()) || []).filter(name => name)
      )
    );
  
    const packageHeaders: string[] = [];
    const packageDataNamesForLookup: string[] = []; 
    const addedDataNames = new Set<string>();
  
    preferredPackageMap.forEach(preferredPkg => {
      if (allActualUniquePackageNamesFromYachts.includes(preferredPkg.dataName)) {
        packageHeaders.push(preferredPkg.header);
        packageDataNamesForLookup.push(preferredPkg.dataName);
        addedDataNames.add(preferredPkg.dataName);
      }
    });
  
    allActualUniquePackageNamesFromYachts.sort().forEach(actualName => {
      if (!addedDataNames.has(actualName)) {
        packageHeaders.push(actualName); 
        packageDataNamesForLookup.push(actualName);
      }
    });
    
    const baseHeadersPart1: string[] = [
      'ID', 'Client Name', 'Agent Name', 'Yacht Name', 'Status', 'Lead/Event Date', 'Type', 'Payment Confirmation Status', 
      'Transaction ID', 'Payment Mode', 'Total Guests',
    ];
    
    const financialAndAuditHeaders: string[] = [
      'Total Amount', 'Agent Discount (%)', 'Commission Amount', 'Net Amount', 'Paid Amount', 'Balance',
      'Notes', 'Modified By', 'Lead Owner', 'Created At', 'Updated At'
    ];
  
    const finalCsvHeaders = [...baseHeadersPart1, ...packageHeaders, ...financialAndAuditHeaders];
    
    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) return '';
      let stringValue = String(cellData);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
  
    const csvRows = [
      finalCsvHeaders.join(','),
      ...filteredLeads.map(lead => {
        const totalGuests = lead.packageQuantities?.reduce((sum, pq) => sum + (Number(pq.quantity) || 0), 0) || 0;
        
        const leadPackageMap = new Map<string, number>();
        lead.packageQuantities?.forEach(pq => {
          leadPackageMap.set(pq.packageName.trim(), Number(pq.quantity || 0));
        });
  
        const rowDataPart1 = [
          escapeCsvCell(lead.id),
          escapeCsvCell(lead.clientName),
          escapeCsvCell(agentMap[lead.agent] || lead.agent),
          escapeCsvCell(yachtMap[lead.yacht] || lead.yacht),
          escapeCsvCell(lead.status),
          escapeCsvCell(lead.month ? format(parseISO(lead.month), 'dd/MM/yyyy HH:mm') : ''),
          escapeCsvCell(lead.type),
          escapeCsvCell(lead.paymentConfirmationStatus), 
          escapeCsvCell(lead.transactionId),
          escapeCsvCell(lead.modeOfPayment),
          escapeCsvCell(totalGuests),
        ];
  
        const packageQtyValues = packageDataNamesForLookup.map(dataName =>
          escapeCsvCell(leadPackageMap.get(dataName) || 0) 
        );
        
        const financialAndAuditValues = [
          escapeCsvCell(lead.totalAmount),
          escapeCsvCell(lead.commissionPercentage),
          escapeCsvCell(lead.commissionAmount),
          escapeCsvCell(lead.netAmount),
          escapeCsvCell(lead.paidAmount),
          escapeCsvCell(lead.balanceAmount),
          escapeCsvCell(lead.notes),
          escapeCsvCell(userMap[lead.lastModifiedByUserId || ''] || lead.lastModifiedByUserId),
          escapeCsvCell(userMap[lead.ownerUserId || ''] || lead.ownerUserId),
          escapeCsvCell(lead.createdAt ? format(parseISO(lead.createdAt), 'dd/MM/yyyy HH:mm') : ''),
          escapeCsvCell(lead.updatedAt ? format(parseISO(lead.updatedAt), 'dd/MM/yyyy HH:mm') : ''),
        ];
        
        return [...rowDataPart1, ...packageQtyValues, ...financialAndAuditValues].join(',');
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
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)} 
        </div>
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
        actions={<ImportExportButtons
          onAddLeadClick={handleAddLeadClick}
          onCsvImport={handleCsvImport}
          onCsvExport={handleCsvExport}
        />}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
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
                <SelectItem key={status} value={status}>{status}</SelectItem>))}
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
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-filter-leads"><SelectValue placeholder="All Users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {Object.entries(userMap).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={resetFilters} variant="outline" className="w-full">Reset Filters</Button>
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
        currentUserId={SIMULATED_CURRENT_USER_ID}
      />

      {isLeadDialogOpen && (
        <LeadFormDialog
          isOpen={isLeadDialogOpen}
          onOpenChange={setIsLeadDialogOpen}
          lead={editingLead}
          onSubmitSuccess={handleLeadFormSubmit}
        />
      )}
    </div>
  );
}

