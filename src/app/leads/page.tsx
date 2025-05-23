
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, ModeOfPayment, User, Agent, Yacht } from '@/lib/types';
import { placeholderUsers } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers';

const ensureNumericDefaults = (leadData: Partial<Lead>): Partial<Lead> => {
  const numericQtyFields: (keyof Lead)[] = [
    'dhowChildQty', 'dhowAdultQty', 'dhowVipQty', 'dhowVipChildQty', 'dhowVipAlcoholQty',
    'oeChildQty', 'oeAdultQty', 'oeVipQty', 'oeVipChildQty', 'oeVipAlcoholQty',
    'sunsetChildQty', 'sunsetAdultQty', 'sunsetVipQty', 'sunsetVipChildQty', 'sunsetVipAlcoholQty',
    'lotusChildQty', 'lotusAdultQty', 'lotusVipQty', 'lotusVipChildQty', 'lotusVipAlcoholQty',
    'royalQty', 'othersAmtCake',
    'totalAmount', 'commissionPercentage', 'commissionAmount', 'netAmount', 'paidAmount', 'balanceAmount',
  ];
  const result = { ...leadData };
  numericQtyFields.forEach(field => {
    if (result[field] === undefined || result[field] === null || isNaN(Number(result[field]))) {
      result[field] = 0 as any;
    } else {
      result[field] = Number(result[field]) as any;
    }
  });
  return result;
};

const convertValue = (key: keyof Lead, value: string): any => {
  const trimmedValue = value ? String(value).trim() : '';

  if (trimmedValue === '' || value === null || value === undefined) {
    switch (key) {
        case 'dhowChildQty': case 'dhowAdultQty': case 'dhowVipQty': case 'dhowVipChildQty': case 'dhowVipAlcoholQty':
        case 'oeChildQty': case 'oeAdultQty': case 'oeVipQty': case 'oeVipChildQty': case 'oeVipAlcoholQty':
        case 'sunsetChildQty': case 'sunsetAdultQty': case 'sunsetVipQty': case 'sunsetVipChildQty': case 'sunsetVipAlcoholQty':
        case 'lotusChildQty': case 'lotusAdultQty': case 'lotusVipQty': case 'lotusVipChildQty': case 'lotusVipAlcoholQty':
        case 'royalQty':
        case 'othersAmtCake': case 'totalAmount':
        case 'commissionPercentage': case 'commissionAmount': case 'netAmount':
        case 'paidAmount': case 'balanceAmount':
            return 0;
        case 'modeOfPayment': return 'Online'; 
        case 'status': return 'New'; 
        default: return undefined;
    }
  }

  switch (key) {
    case 'dhowChildQty': case 'dhowAdultQty': case 'dhowVipQty': case 'dhowVipChildQty': case 'dhowVipAlcoholQty':
    case 'oeChildQty': case 'oeAdultQty': case 'oeVipQty': case 'oeVipChildQty': case 'oeVipAlcoholQty':
    case 'sunsetChildQty': case 'sunsetAdultQty': case 'sunsetVipQty': case 'sunsetVipChildQty': case 'sunsetVipAlcoholQty':
    case 'lotusChildQty': case 'lotusAdultQty': case 'lotusVipQty': case 'lotusVipChildQty': case 'lotusVipAlcoholQty':
    case 'royalQty':
    case 'othersAmtCake': case 'totalAmount':
    case 'commissionPercentage': case 'commissionAmount': case 'netAmount':
    case 'paidAmount': case 'balanceAmount':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? 0 : num;
    case 'modeOfPayment':
      const validModes: ModeOfPayment[] = ['Online', 'Offline', 'Credit'];
      return validModes.includes(trimmedValue as ModeOfPayment) ? trimmedValue : 'Online';
    case 'status':
        const validStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];
        return validStatuses.includes(trimmedValue as LeadStatus) ? trimmedValue : 'New';
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedYachtId, setSelectedYachtId] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all'); // Existing status filter

  const leadStatusOptions: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];


  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // Fetch Leads, Agents, Yachts
        const [leadsRes, agentsRes, yachtsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/agents'),
          fetch('/api/yachts'),
        ]);

        if (!leadsRes.ok) throw new Error(`Failed to fetch leads: ${leadsRes.statusText}`);
        const leadsData = await leadsRes.json();
        setAllLeads(Array.isArray(leadsData) ? leadsData : []);

        if (!agentsRes.ok) throw new Error(`Failed to fetch agents: ${agentsRes.statusText}`);
        const agentsData = await agentsRes.json();
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);

        if (!yachtsRes.ok) throw new Error(`Failed to fetch yachts: ${yachtsRes.statusText}`);
        const yachtsData = await yachtsRes.json();
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);

        // Load users from localStorage for userMap
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        let usersToMap: User[] = placeholderUsers; // Fallback
        if (storedUsers) {
          try {
            const parsedUsers: User[] = JSON.parse(storedUsers);
            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
              usersToMap = parsedUsers;
            }
          } catch (e) {
            console.error("Error parsing users from localStorage for map:", e);
          }
        }
        const map: { [id: string]: string } = {};
        usersToMap.forEach(user => { map[user.id] = user.name; });
        setUserMap(map);

      } catch (error) {
        console.error("Error fetching initial data for Leads page:", error);
        setFetchError((error as Error).message);
        toast({ title: 'Error Fetching Data', description: (error as Error).message, variant: 'destructive' });
        setAllLeads([]); 
        setAllAgents([]);
        setAllYachts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [toast]);

  const refreshLeads = async () => { // Renamed from fetchLeads to avoid conflict
    setIsLoading(true); // Optionally set loading true for refresh
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }
      const data = await response.json();
      setAllLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error refreshing leads:", error);
      toast({ title: 'Error Refreshing Leads', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  const handleAddLeadClick = () => {
    setEditingLead(null);
    setIsLeadDialogOpen(true);
  };

  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleLeadFormSubmit = async (submittedLeadData: Lead) => {
    const leadPayload = {
      ...submittedLeadData,
      lastModifiedByUserId: 'DO-user1', 
      updatedAt: new Date().toISOString(),
    };

    try {
      let response;
      if (editingLead && leadPayload.id === editingLead.id) {
        response = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadPayload),
        });
      } else {
        const newLeadWithTimestamps = {
            ...leadPayload,
            createdAt: new Date().toISOString(),
            id: leadPayload.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2,7)}`
        };
        response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLeadWithTimestamps),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save lead: ${response.statusText}`);
      }
      
      toast({
        title: editingLead ? 'Lead Updated' : 'Lead Added',
        description: `Lead for ${submittedLeadData.clientName} has been saved.`,
      });
      
      refreshLeads(); 
      setIsLeadDialogOpen(false);
      setEditingLead(null);

    } catch (error) {
      console.error("Error saving lead:", error);
      toast({ title: 'Error Saving Lead', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm(`Are you sure you want to delete lead ${leadId}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete lead: ${response.statusText}`);
      }
      toast({ title: 'Lead Deleted', description: `Lead ${leadId} has been deleted.` });
      refreshLeads(); 
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({ title: 'Error Deleting Lead', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleCsvImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      if (!csvText) {
        toast({ title: 'Import Error', description: 'Could not read the CSV file.', variant: 'destructive' });
        return;
      }
      try {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          toast({ title: 'Import Error', description: 'CSV file must have a header and at least one data row.', variant: 'destructive' });
          return;
        }

        let headerLine = lines[0];
        if (headerLine.charCodeAt(0) === 0xFEFF) { 
            headerLine = headerLine.substring(1);
        }
        const headers = headerLine.split(',').map(h => h.trim() as keyof Lead);
        console.log("Parsed CSV Headers:", headers);

        const newLeadsFromCsv: Lead[] = [];
        let skippedCount = 0;
        let successCount = 0;
        
        const currentApiLeadsResponse = await fetch('/api/leads');
        const currentApiLeads: Lead[] = await currentApiLeadsResponse.json();
        const existingLeadIds = new Set(currentApiLeads.map(l => l.id));

        for (let i = 1; i < lines.length; i++) {
          let data = lines[i].split(',');

          if (data.length > headers.length) {
            const extraColumns = data.slice(headers.length);
            const allExtraAreEmpty = extraColumns.every(col => (col || '').trim() === '');
            if (allExtraAreEmpty) {
              data = data.slice(0, headers.length);
            }
          }

          if (data.length !== headers.length) {
            console.warn(`Skipping malformed CSV line ${i + 1}: Expected ${headers.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            skippedCount++;
            continue;
          }

          const parsedRow = {} as Partial<Lead>;
          headers.forEach((header, index) => {
            parsedRow[header] = convertValue(header, data[index]);
          });
          
          if (i === 1) { 
            console.log("First Parsed Data Row (raw values from CSV after convertValue):", JSON.parse(JSON.stringify(parsedRow)));
          }

          let leadId = typeof parsedRow.id === 'string' && parsedRow.id.trim() !== '' ? parsedRow.id.trim() : undefined;

          if (!leadId) {
            const baseGeneratedId = `imported-lead-${Date.now()}-${i}`;
            let currentGeneratedId = baseGeneratedId;
            let uniqueIdCounter = 0;
            while (existingLeadIds.has(currentGeneratedId) || newLeadsFromCsv.some(l => l.id === currentGeneratedId) ) {
                uniqueIdCounter++;
                currentGeneratedId = `${baseGeneratedId}-${uniqueIdCounter}`;
            }
            leadId = currentGeneratedId;
          }

          const numericDefaultsApplied = ensureNumericDefaults(parsedRow);

          const fullLead: Lead = {
            id: leadId!,
            agent: typeof numericDefaultsApplied.agent === 'string' ? numericDefaultsApplied.agent : '',
            status: (numericDefaultsApplied.status as LeadStatus) || 'New',
            month: typeof numericDefaultsApplied.month === 'string' && numericDefaultsApplied.month.match(/^\d{4}-\d{2}$/) ? numericDefaultsApplied.month : new Date().toISOString().slice(0,7),
            yacht: typeof numericDefaultsApplied.yacht === 'string' ? numericDefaultsApplied.yacht : '',
            type: typeof numericDefaultsApplied.type === 'string' && numericDefaultsApplied.type.trim() !== '' ? numericDefaultsApplied.type : 'Imported',
            modeOfPayment: (numericDefaultsApplied.modeOfPayment as ModeOfPayment) || 'Online',
            clientName: typeof numericDefaultsApplied.clientName === 'string' && numericDefaultsApplied.clientName.trim() !== '' ? numericDefaultsApplied.clientName : 'N/A',
            invoiceId: typeof numericDefaultsApplied.invoiceId === 'string' ? numericDefaultsApplied.invoiceId : undefined,

            dhowChildQty: numericDefaultsApplied.dhowChildQty,
            dhowAdultQty: numericDefaultsApplied.dhowAdultQty,
            dhowVipQty: numericDefaultsApplied.dhowVipQty,
            dhowVipChildQty: numericDefaultsApplied.dhowVipChildQty,
            dhowVipAlcoholQty: numericDefaultsApplied.dhowVipAlcoholQty,

            oeChildQty: numericDefaultsApplied.oeChildQty,
            oeAdultQty: numericDefaultsApplied.oeAdultQty,
            oeVipQty: numericDefaultsApplied.oeVipQty,
            oeVipChildQty: numericDefaultsApplied.oeVipChildQty,
            oeVipAlcoholQty: numericDefaultsApplied.oeVipAlcoholQty,

            sunsetChildQty: numericDefaultsApplied.sunsetChildQty,
            sunsetAdultQty: numericDefaultsApplied.sunsetAdultQty,
            sunsetVipQty: numericDefaultsApplied.sunsetVipQty,
            sunsetVipChildQty: numericDefaultsApplied.sunsetVipChildQty,
            sunsetVipAlcoholQty: numericDefaultsApplied.sunsetVipAlcoholQty,

            lotusChildQty: numericDefaultsApplied.lotusChildQty,
            lotusAdultQty: numericDefaultsApplied.lotusAdultQty,
            lotusVipQty: numericDefaultsApplied.lotusVipQty,
            lotusVipChildQty: numericDefaultsApplied.lotusVipChildQty,
            lotusVipAlcoholQty: numericDefaultsApplied.lotusVipAlcoholQty,

            royalQty: numericDefaultsApplied.royalQty,
            othersAmtCake: numericDefaultsApplied.othersAmtCake,
            totalAmount: numericDefaultsApplied.totalAmount,
            commissionPercentage: numericDefaultsApplied.commissionPercentage,
            commissionAmount: numericDefaultsApplied.commissionAmount,
            netAmount: numericDefaultsApplied.netAmount,
            paidAmount: numericDefaultsApplied.paidAmount,
            balanceAmount: numericDefaultsApplied.balanceAmount,
            
            createdAt: typeof numericDefaultsApplied.createdAt === 'string' && numericDefaultsApplied.createdAt.trim() !== '' ? numericDefaultsApplied.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastModifiedByUserId: 'DO-user-importer', 
          };
          if (i === 1) { 
             console.log("First Full Lead Object (after defaults, before API post):", JSON.parse(JSON.stringify(fullLead)));
          }

          const isDuplicateInExisting = existingLeadIds.has(fullLead.id);
          const isDuplicateInThisBatch = newLeadsFromCsv.some(l => l.id === fullLead.id);

          if (!isDuplicateInExisting && !isDuplicateInThisBatch) {
            newLeadsFromCsv.push(fullLead);
            existingLeadIds.add(fullLead.id); 
          } else {
            console.warn(`Skipping import for lead with duplicate ID: ${fullLead.id} at CSV row ${i + 1}. Line: "${lines[i]}"`);
            skippedCount++;
          }
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
                const errorData = await response.json();
                console.warn(`Failed to import lead ${leadToImport.id} via API: ${errorData.message || response.statusText}. Payload:`, JSON.stringify(leadToImport));
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`API error importing lead ${leadToImport.id}:`, apiError, "Payload:", JSON.stringify(leadToImport));
                skippedCount++;
            }
          }
          
          refreshLeads(); 

          if (successCount > 0 && skippedCount === 0) {
            toast({ title: 'Import Successful', description: `${successCount} new leads imported.` });
          } else if (successCount > 0 && skippedCount > 0) {
             toast({ title: 'Import Partially Completed', description: `${successCount} new leads imported, ${skippedCount} CSV rows/leads were skipped. Check console for details.`, variant: 'default' });
          } else if (successCount === 0 && skippedCount > 0) {
             toast({
                title: 'Import Failed',
                description: `All ${skippedCount} valid data rows from CSV were skipped during API submission or due to duplicates. Check console for details.`,
                variant: 'destructive'
            });
          } else { 
             toast({ title: 'Import Complete', description: 'No new leads were imported (file had no valid data rows or all were duplicates of existing leads). Check console for details on any parsing issues.' });
          }

        } else if (skippedCount > 0 && skippedCount === (lines.length -1) && lines.length > 1) {
           toast({
            title: 'Import Failed',
            description: `All ${lines.length - 1} data rows were skipped during parsing or due to duplicate IDs. Please check your CSV file. Common issues: column count mismatch, incorrect delimiter, or duplicate IDs. Ensure IDs in CSV are unique if provided. Check console for details on skipped rows.`,
            variant: 'destructive'
          });
        } else { 
          toast({ title: 'Import Complete', description: 'No new leads were imported. The file may have contained only duplicates or no valid data rows after the header. Check console for details.' });
        }

      } catch (error) {
        console.error("CSV Parsing Error:", error);
        let message = 'Failed to parse CSV file.';
        if (error instanceof Error) {
          message = error.message;
        }
        toast({ title: 'Import Error', description: message, variant: 'destructive' });
      }
    };
    reader.onerror = () => {
        toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    }
    reader.readAsText(file);
  };


  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allLeads.forEach(lead => months.add(lead.month.substring(5, 7)));
    return Array.from(months).sort().map(m => ({ value: m, label: format(new Date(2000, parseInt(m)-1, 1), 'MMMM') }));
  }, [allLeads]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allLeads.forEach(lead => years.add(lead.month.substring(0, 4)));
    return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a));
  }, [allLeads]);


  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      const leadDate = parseISO(lead.createdAt);
      const leadMonthYear = lead.month; 

      if (startDate && endDate && !isWithinInterval(leadDate, { start: startDate, end: endDate })) return false;
      if (!startDate && !endDate) { // Only apply month/year if no date range
        if (selectedMonth !== 'all' && leadMonthYear.substring(5,7) !== selectedMonth) return false;
        if (selectedYear !== 'all' && leadMonthYear.substring(0,4) !== selectedYear) return false;
      }
      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && lead.lastModifiedByUserId !== selectedUserId) return false;
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedMonth, selectedYear, selectedYachtId, selectedAgentId, selectedUserId, statusFilter]);

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
    setStatusFilter('all');
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
                 {[...Array(8)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
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
        <p className="text-destructive text-center py-10">Failed to load lead data: {fetchError}</p>
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
                    onCsvExport={() => { 
                        if (allLeads.length === 0) {
                            toast({ title: 'No Data', description: 'There are no leads to export.', variant: 'default' });
                            return;
                        }
                        const headers: (keyof Lead)[] = [
                            'id', 'agent', 'status', 'month', 'yacht', 'type', 'invoiceId', 'modeOfPayment', 'clientName',
                            'dhowChildQty', 'dhowAdultQty', 'dhowVipQty', 'dhowVipChildQty', 'dhowVipAlcoholQty',
                            'oeChildQty', 'oeAdultQty', 'oeVipQty', 'oeVipChildQty', 'oeVipAlcoholQty',
                            'sunsetChildQty', 'sunsetAdultQty', 'sunsetVipQty', 'sunsetVipChildQty', 'sunsetVipAlcoholQty',
                            'lotusChildQty', 'lotusAdultQty', 'lotusVipQty', 'lotusVipChildQty', 'lotusVipAlcoholQty',
                            'royalQty',
                            'othersAmtCake', 'totalAmount', 'commissionPercentage',
                            'commissionAmount', 'netAmount', 'paidAmount', 'balanceAmount', 
                            'createdAt', 'updatedAt', 'lastModifiedByUserId'
                        ];
                        const escapeCsvCell = (cellData: any): string => {
                            if (cellData === null || cellData === undefined) return '';
                            const stringValue = String(cellData);
                            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                            }
                            return stringValue;
                        };
                        const csvRows = [
                            headers.join(','),
                            ...allLeads.map(lead =>
                            headers.map(header => escapeCsvCell(lead[header])).join(',')
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
                    }}
                  />}
      />
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
        <div>
          <Label htmlFor="start-date-leads">Start Date</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
        </div>
        <div>
          <Label htmlFor="end-date-leads">End Date</Label>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" disabled={(date) => startDate ? date < startDate : false} />
        </div>
        <div>
          <Label htmlFor="month-filter-leads">Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!!(startDate && endDate)}>
            <SelectTrigger id="month-filter-leads"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year-filter-leads">Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!!(startDate && endDate)}>
            <SelectTrigger id="year-filter-leads"><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <div className="flex items-end xl:col-span-1"> {/* Ensure button aligns well */}
            <Button onClick={resetFilters} variant="outline" className="w-full">Reset Filters</Button>
        </div>
      </div>

      <LeadsTable leads={filteredLeads} onEditLead={handleEditLeadClick} onDeleteLead={handleDeleteLead} userMap={userMap} />
      
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
