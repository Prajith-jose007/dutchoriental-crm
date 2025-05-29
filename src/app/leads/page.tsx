
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, User, Agent, Yacht, ExportedLeadStatus, ExportedModeOfPayment, ExportedLeadType, LeadType } from '@/lib/types';
import { leadStatusOptions, modeOfPaymentOptions, leadTypeOptions } from '@/lib/types'; // Import options
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, isValid, formatISO } from 'date-fns'; 

const SIMULATED_CURRENT_USER_ID = 'DO-user1';

const csvHeaderMapping: { [csvHeaderKey: string]: keyof Lead } = {
  'id': 'id',
  'clientname': 'clientName', 'client name': 'clientName',
  'agent': 'agent', 'agentid': 'agent',
  'yacht': 'yacht', 'yachtid': 'yacht',
  'status': 'status',
  'month': 'month', 'lead/event date': 'month', // 'month' is the lead/event date
  'notes': 'notes', 'user feed': 'notes',
  'type': 'type', 'lead type': 'type',
  'invoiceid': 'invoiceId', 'invoice id': 'invoiceId',
  'modeofpayment': 'modeOfPayment', 'payment mode': 'modeOfPayment',
  
  // Standardized Package Quantities (match Lead type fields)
  'qty_childrate': 'qty_childRate',
  'qty_adultstandardrate': 'qty_adultStandardRate',
  'qty_adultstandarddrinksrate': 'qty_adultStandardDrinksRate',
  'qty_vipchildrate': 'qty_vipChildRate',
  'qty_vipadultrate': 'qty_vipAdultRate',
  'qty_vipadultdrinksrate': 'qty_vipAdultDrinksRate',
  'qty_royalchildrate': 'qty_royalChildRate',
  'qty_royaladultrate': 'qty_royalAdultRate',
  'qty_royaldrinksrate': 'qty_royalDrinksRate',
  'othersamtcake': 'othersAmtCake', 'custom charge qty': 'othersAmtCake',

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

const convertCsvValue = (key: keyof Lead, value: string): any => {
  const trimmedValue = value ? String(value).trim() : '';

  if (trimmedValue === '' || value === null || value === undefined) {
    switch (key) {
      case 'qty_childRate': case 'qty_adultStandardRate': case 'qty_adultStandardDrinksRate':
      case 'qty_vipChildRate': case 'qty_vipAdultRate': case 'qty_vipAdultDrinksRate':
      case 'qty_royalChildRate': case 'qty_royalAdultRate': case 'qty_royalDrinksRate':
      case 'othersAmtCake': case 'totalAmount': case 'commissionPercentage':
      case 'commissionAmount': case 'netAmount': case 'paidAmount': case 'balanceAmount':
        return 0;
      case 'modeOfPayment': return 'Online';
      case 'status': return 'Upcoming';
      case 'type': return 'Private'; // Default LeadType
      case 'notes': return '';
      case 'month': return formatISO(new Date()); 
      case 'createdAt': case 'updatedAt': return formatISO(new Date());
      default: return undefined;
    }
  }

  switch (key) {
    case 'qty_childRate': case 'qty_adultStandardRate': case 'qty_adultStandardDrinksRate':
    case 'qty_vipChildRate': case 'qty_vipAdultRate': case 'qty_vipAdultDrinksRate':
    case 'qty_royalChildRate': case 'qty_royalAdultRate': case 'qty_royalDrinksRate':
    case 'othersAmtCake': case 'totalAmount': case 'commissionPercentage':
    case 'commissionAmount': case 'netAmount': case 'paidAmount': case 'balanceAmount':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? 0 : num;
    case 'modeOfPayment':
      return modeOfPaymentOptions.includes(trimmedValue as ExportedModeOfPayment) ? trimmedValue : 'Online';
    case 'status':
      return leadStatusOptions.includes(trimmedValue as ExportedLeadStatus) ? trimmedValue : 'Upcoming';
    case 'type':
      return leadTypeOptions.includes(trimmedValue as ExportedLeadType) ? trimmedValue : 'Private';
    case 'month': 
    case 'createdAt':
    case 'updatedAt':
      try {
        const parsedDate = parseISO(trimmedValue);
        if (isValid(parsedDate)) return formatISO(parsedDate);
      } catch (e) { /* ignore ISO parse error and try other formats */ }
      
      try {
        const dateObj = new Date(trimmedValue); 
        if (isValid(dateObj)) return formatISO(dateObj);
      } catch (e) {/* ignore */ }
      console.warn(`[CSV Import] Could not parse date "${trimmedValue}" for key "${key}". Defaulting to current date.`);
      return formatISO(new Date());
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
    };
    
    if (!editingLead) { 
      payload.ownerUserId = SIMULATED_CURRENT_USER_ID;
      payload.createdAt = new Date().toISOString();
      payload.id = payload.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    } else { 
      payload.ownerUserId = editingLead.ownerUserId || SIMULATED_CURRENT_USER_ID; 
      payload.createdAt = editingLead.createdAt || new Date().toISOString(); 
    }

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
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to save lead: ${response.statusText}`);
      }
      
      toast({
        title: editingLead ? 'Lead Updated' : 'Lead Added',
        description: `Lead for ${submittedLeadData.clientName} has been saved.`,
      });
      
      await fetchAllData(); 
      setIsLeadDialogOpen(false);
      setEditingLead(null);

    } catch (error) {
      console.error("Error saving lead:", error);
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
        const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to delete lead: ${response.statusText}`);
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
        
        const currentApiLeadsResponse = await fetch('/api/leads');
        const currentApiLeads: Lead[] = currentApiLeadsResponse.ok ? await currentApiLeadsResponse.json() : [];
        const existingLeadIds = new Set(currentApiLeads.map(l => l.id));

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

          const parsedRow = {} as Partial<Lead>;
          fileHeaders.forEach((fileHeader, index) => {
            const leadKey = csvHeaderMapping[fileHeader]; 
            if (leadKey) {
                parsedRow[leadKey] = convertCsvValue(leadKey, data[index]);
            } else {
                console.warn(`[CSV Import Leads] Unknown header "${fileHeader}" in CSV row ${i+1}. Skipping this column.`);
            }
          });
           if (i === 1) console.log("[CSV Import Leads] Processing Row 1 - Parsed (after mapping & convertCsvValue):", JSON.parse(JSON.stringify(parsedRow)));

          let leadId = typeof parsedRow.id === 'string' && parsedRow.id.trim() !== '' ? parsedRow.id.trim() : undefined;
          const baseGeneratedId = `imported-lead-${Date.now()}-${i}`;
          if (!leadId) {
            let currentGeneratedId = baseGeneratedId;
            let uniqueIdCounter = 0;
            while (existingLeadIds.has(currentGeneratedId) || newLeadsFromCsv.some(l => l.id === currentGeneratedId)) {
              uniqueIdCounter++;
              currentGeneratedId = `${baseGeneratedId}-${uniqueIdCounter}`;
            }
            leadId = currentGeneratedId;
          }

          const fullLead: Lead = {
            id: leadId!,
            clientName: parsedRow.clientName || 'N/A from CSV',
            agent: parsedRow.agent || '',
            yacht: parsedRow.yacht || '',
            status: parsedRow.status || 'Upcoming',
            month: parsedRow.month || formatISO(new Date()), 
            notes: parsedRow.notes || undefined,
            type: parsedRow.type || 'Private',
            invoiceId: parsedRow.invoiceId || undefined,
            modeOfPayment: parsedRow.modeOfPayment || 'Online',
            
            qty_childRate: parsedRow.qty_childRate ?? 0,
            qty_adultStandardRate: parsedRow.qty_adultStandardRate ?? 0,
            qty_adultStandardDrinksRate: parsedRow.qty_adultStandardDrinksRate ?? 0,
            qty_vipChildRate: parsedRow.qty_vipChildRate ?? 0,
            qty_vipAdultRate: parsedRow.qty_vipAdultRate ?? 0,
            qty_vipAdultDrinksRate: parsedRow.qty_vipAdultDrinksRate ?? 0,
            qty_royalChildRate: parsedRow.qty_royalChildRate ?? 0,
            qty_royalAdultRate: parsedRow.qty_royalAdultRate ?? 0,
            qty_royalDrinksRate: parsedRow.qty_royalDrinksRate ?? 0,
            othersAmtCake: parsedRow.othersAmtCake ?? 0, 
            
            totalAmount: parsedRow.totalAmount ?? 0, 
            commissionPercentage: parsedRow.commissionPercentage ?? 0,
            commissionAmount: parsedRow.commissionAmount ?? 0,
            netAmount: parsedRow.netAmount ?? 0,
            paidAmount: parsedRow.paidAmount ?? 0,
            balanceAmount: parsedRow.balanceAmount ?? 0,
            createdAt: parsedRow.createdAt || formatISO(new Date()),
            updatedAt: formatISO(new Date()),
            lastModifiedByUserId: SIMULATED_CURRENT_USER_ID,
            ownerUserId: SIMULATED_CURRENT_USER_ID, 
          };
          if (i === 1) console.log("[CSV Import Leads] Processing Row 1 - Full Lead Object (to be POSTed):", JSON.parse(JSON.stringify(fullLead)));
          
          if (!fullLead.clientName || !fullLead.agent || !fullLead.yacht || !fullLead.month) {
             console.warn(`[CSV Import Leads] Skipping lead due to missing required fields (clientName, agent, yacht, month/event date) at CSV row ${i+1}. Lead data:`, fullLead);
             skippedCount++;
             continue;
          }
          if (existingLeadIds.has(fullLead.id) || newLeadsFromCsv.some(l => l.id === fullLead.id)) {
            console.warn(`[CSV Import Leads] Skipping lead with duplicate ID: ${fullLead.id} from CSV row ${i+1}.`);
            skippedCount++;
            continue;
          }

          newLeadsFromCsv.push(fullLead);
          existingLeadIds.add(fullLead.id); 
        }

        if (newLeadsFromCsv.length > 0) {
          for (const leadToImport of newLeadsFromCsv) {
            try {
              const response = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadToImport),
              });
              if (response.ok) {
                successCount++;
              } else {
                const errorData = await response.json().catch(() => ({ message: `API Error: ${response.statusText}` }));
                console.warn(`[CSV Import Leads] API Error for lead ID ${leadToImport.id}: ${errorData.message || response.statusText}. Payload:`, leadToImport);
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`[CSV Import Leads] Network/JS Error importing lead ${leadToImport.id}:`, apiError, "Payload:", leadToImport);
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
      let leadCreationDate: Date | null = null;
      try {
        if (lead.createdAt && isValid(parseISO(lead.createdAt))) {
          leadCreationDate = parseISO(lead.createdAt);
        }
      } catch (e) { console.warn(`Invalid createdAt date for lead ${lead.id}: ${lead.createdAt}`); }

      if (startDate && endDate && leadCreationDate) {
        if (!isWithinInterval(leadCreationDate, { start: startDate, end: endDate })) return false;
      } else if (startDate && leadCreationDate) {
        if (leadCreationDate < startDate) return false;
      } else if (endDate && leadCreationDate) {
        if (leadCreationDate > endDate) return false;
      }
      
      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && lead.lastModifiedByUserId !== selectedUserId) return false;
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedYachtId, selectedAgentId, selectedUserId, statusFilter]);

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
    setStatusFilter('all');
  };

  if (isLoading && allLeads.length === 0 && allAgents.length === 0 && allYachts.length === 0) { 
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
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  if (fetchError && allLeads.length === 0 && allAgents.length === 0 && allYachts.length === 0) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Leads Management" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load essential data for this page: {fetchError}</p>
      </div>
    );
  }

  const handleCsvExport = () => {
    if (filteredLeads.length === 0) {
      toast({ title: 'No Data', description: 'There are no leads (matching current filters) to export.', variant: 'default' });
      return;
    }
    
    const headers: (keyof Lead)[] = [
      'id', 'clientName', 'agent', 'yacht', 'status', 'month', 'type', 'invoiceId', 'modeOfPayment', 'notes',
      'qty_childRate', 'qty_adultStandardRate', 'qty_adultStandardDrinksRate',
      'qty_vipChildRate', 'qty_vipAdultRate', 'qty_vipAdultDrinksRate',
      'qty_royalChildRate', 'qty_royalAdultRate', 'qty_royalDrinksRate',
      'othersAmtCake', 'totalAmount', 'commissionPercentage',
      'commissionAmount', 'netAmount', 'paidAmount', 'balanceAmount',
      'createdAt', 'updatedAt', 'lastModifiedByUserId', 'ownerUserId'
    ];
    const escapeCsvCell = (cellData: any, headerKey: keyof Lead): string => {
      if (cellData === null || cellData === undefined) return '';
      let stringValue = String(cellData);
      
      if (['month', 'createdAt', 'updatedAt'].includes(headerKey) ) {
          try {
              const date = parseISO(stringValue);
              if (isValid(date)) {
                stringValue = format(date, 'dd/MM/yyyy HH:mm:ss');
              }
          } catch (e) { /* ignore if not a valid date string for these specific keys */ }
      }
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    const csvRows = [
      headers.join(','),
      ...filteredLeads.map(lead =>
        headers.map(header => escapeCsvCell(lead[header], header)).join(',')
      )
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
          <Label htmlFor="start-date-leads">Start Date (Created)</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
        </div>
        <div>
          <Label htmlFor="end-date-leads">End Date (Created)</Label>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" disabled={(date) => startDate ? date < startDate : false} />
        </div>
        <div>
          <Label htmlFor="status-filter-leads">Status</Label>
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
          <Label htmlFor="user-filter-leads">User (Modified Lead)</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-filter-leads"><SelectValue placeholder="All Users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {Object.entries(userMap).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end md:col-span-2 lg:col-span-1 xl:col-span-2">
          <Button onClick={resetFilters} variant="outline" className="w-full">Reset Filters</Button>
        </div>
      </div>

      {isLoading && allLeads.length === 0 ? (
        <div className="space-y-2 mt-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <LeadsTable
          leads={filteredLeads}
          onEditLead={handleEditLeadClick}
          onDeleteLead={handleDeleteLead}
          userMap={userMap}
          agentMap={agentMap}
          yachtMap={yachtMap}
          currentUserId={SIMULATED_CURRENT_USER_ID}
        />
      )}
      
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

