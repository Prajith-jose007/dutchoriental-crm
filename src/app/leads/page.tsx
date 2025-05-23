
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, ModeOfPayment, ExportedLeadStatus, User } from '@/lib/types';
import { placeholderUsers } from '@/lib/placeholder-data'; // For fallback userMap
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers'; // Same key as in UsersPage

// Helper to ensure all numeric package quantities default to 0 if undefined/null
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
  const trimmedValue = value ? String(value).trim() : ''; // Ensure value is treated as string before trim

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
        case 'modeOfPayment': return 'Online'; // Default mode of payment
        case 'status': return 'New'; // Default status
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');

  const leadStatusOptions: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];


  // Fetch users from localStorage to build userMap
  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let usersToMap: User[] = placeholderUsers; // Fallback to placeholders

    if (storedUsers) {
      try {
        const parsedUsers: User[] = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers)) {
          usersToMap = parsedUsers;
        }
      } catch (e) {
        console.error("Error parsing users from localStorage for map:", e);
      }
    }
    
    const map: { [id: string]: string } = {};
    usersToMap.forEach(user => {
      map[user.id] = user.name;
    });
    setUserMap(map);
  }, []);


  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }
      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({ title: 'Error Fetching Leads', description: (error as Error).message, variant: 'destructive' });
      setLeads([]); 
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
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
    const leadPayload = {
      ...submittedLeadData,
      lastModifiedByUserId: 'DO-user1', // Placeholder for actual logged-in user
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
      
      fetchLeads(); 
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
      fetchLeads(); 
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
        
        // Fetch current leads from API to check for duplicates by ID
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
          
          if (i === 1) { // Log first parsed data row
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
            status: (numericDefaultsApplied.status as ExportedLeadStatus) || 'New',
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
            lastModifiedByUserId: 'DO-user-importer', // Placeholder for importer user
          };
          if (i === 1) { // Log first full lead object
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
          
          fetchLeads(); 

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
          } else { // successCount === 0 && skippedCount === 0
             toast({ title: 'Import Complete', description: 'No new leads were imported (file had no valid data rows or all were duplicates of existing leads). Check console for details on any parsing issues.' });
          }

        } else if (skippedCount > 0 && skippedCount === (lines.length -1) && lines.length > 1) {
           toast({
            title: 'Import Failed',
            description: `All ${lines.length - 1} data rows were skipped during parsing or due to duplicate IDs. Please check your CSV file. Common issues: column count mismatch, incorrect delimiter, or duplicate IDs. Ensure IDs in CSV are unique if provided. Check console for details on skipped rows.`,
            variant: 'destructive'
          });
        } else { // No new leads and no rows skipped that weren't already duplicates
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

  const filteredLeads = useMemo(() => {
    if (!statusFilter) {
      return leads;
    }
    return leads.filter(lead => lead.status === statusFilter);
  }, [leads, statusFilter]);


  if (isLoading) {
    return <div className="container mx-auto py-2 text-center">Loading leads...</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Leads Management"
        description="Track and manage all your sales leads."
        actions={<ImportExportButtons
                    onAddLeadClick={handleAddLeadClick}
                    onCsvImport={handleCsvImport}
                    onCsvExport={() => { // Simplified direct export handler
                        if (leads.length === 0) {
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
                            ...leads.map(lead =>
                            headers.map(header => escapeCsvCell(lead[header])).join(',')
                            )
                        ];
                        const csvString = csvRows.join('\n');
                        const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' }); // Added BOM for Excel
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
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm font-medium">Filter by Status:</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as LeadStatus | '')}>
                <SelectTrigger id="status-filter" className="w-[180px]">
                    <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {leadStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        {/* Add more filters here as needed */}
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

