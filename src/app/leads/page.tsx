
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, ModeOfPayment, ExportedLeadStatus } from '@/lib/types';
// placeholderLeads will now serve as an initial seed if the backend is empty or for examples.
import { placeholderLeads as initialLeadsData } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';

// const LEADS_STORAGE_KEY = 'dutchOrientalCrmLeads'; // No longer using localStorage

// Keep a mutable copy of initial data for in-memory modifications if API fails or for seeding
// let initialLeads: Lead[] = JSON.parse(JSON.stringify(initialLeadsData));


const convertValue = (key: keyof Lead, value: string): any => {
  const trimmedValue = value ? value.trim() : '';

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
      setLeads(JSON.parse(JSON.stringify(initialLeadsData))); // Fallback to placeholder if API fails
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
    try {
      let response;
      if (editingLead && submittedLeadData.id === editingLead.id) {
        // Update existing lead
        response = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedLeadData),
        });
      } else {
        // Add new lead
         if (leads.some(l => l.id === submittedLeadData.id)) {
            toast({
            title: 'Error Adding Lead',
            description: `A lead with ID ${submittedLeadData.id} already exists. Please use a unique ID or let the system generate one.`,
            variant: 'destructive',
            });
            return;
        }
        response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedLeadData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save lead: ${response.statusText}`);
      }
      
      // const savedLead = await response.json(); // The API returns the saved/updated lead
      toast({
        title: editingLead ? 'Lead Updated' : 'Lead Added',
        description: `Lead for ${submittedLeadData.clientName} has been saved.`,
      });
      
      fetchLeads(); // Re-fetch all leads to update the table
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
      fetchLeads(); // Re-fetch leads
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
        
        const existingLeadIds = new Set(leads.map(l => l.id));


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


          const fullLead: Lead = {
            id: leadId!,
            agent: typeof parsedRow.agent === 'string' ? parsedRow.agent : '',
            status: (parsedRow.status as ExportedLeadStatus) || 'New',
            month: typeof parsedRow.month === 'string' && parsedRow.month.match(/^\d{4}-\d{2}$/) ? parsedRow.month : new Date().toISOString().slice(0,7),
            yacht: typeof parsedRow.yacht === 'string' ? parsedRow.yacht : '',
            type: typeof parsedRow.type === 'string' && parsedRow.type.trim() !== '' ? parsedRow.type : 'Imported',
            modeOfPayment: (parsedRow.modeOfPayment as ModeOfPayment) || 'Online',
            clientName: typeof parsedRow.clientName === 'string' && parsedRow.clientName.trim() !== '' ? parsedRow.clientName : 'N/A',
            invoiceId: typeof parsedRow.invoiceId === 'string' ? parsedRow.invoiceId : undefined,

            dhowChildQty: typeof parsedRow.dhowChildQty === 'number' ? parsedRow.dhowChildQty : 0,
            dhowAdultQty: typeof parsedRow.dhowAdultQty === 'number' ? parsedRow.dhowAdultQty : 0,
            dhowVipQty: typeof parsedRow.dhowVipQty === 'number' ? parsedRow.dhowVipQty : 0,
            dhowVipChildQty: typeof parsedRow.dhowVipChildQty === 'number' ? parsedRow.dhowVipChildQty : 0,
            dhowVipAlcoholQty: typeof parsedRow.dhowVipAlcoholQty === 'number' ? parsedRow.dhowVipAlcoholQty : 0,

            oeChildQty: typeof parsedRow.oeChildQty === 'number' ? parsedRow.oeChildQty : 0,
            oeAdultQty: typeof parsedRow.oeAdultQty === 'number' ? parsedRow.oeAdultQty : 0,
            oeVipQty: typeof parsedRow.oeVipQty === 'number' ? parsedRow.oeVipQty : 0,
            oeVipChildQty: typeof parsedRow.oeVipChildQty === 'number' ? parsedRow.oeVipChildQty : 0,
            oeVipAlcoholQty: typeof parsedRow.oeVipAlcoholQty === 'number' ? parsedRow.oeVipAlcoholQty : 0,

            sunsetChildQty: typeof parsedRow.sunsetChildQty === 'number' ? parsedRow.sunsetChildQty : 0,
            sunsetAdultQty: typeof parsedRow.sunsetAdultQty === 'number' ? parsedRow.sunsetAdultQty : 0,
            sunsetVipQty: typeof parsedRow.sunsetVipQty === 'number' ? parsedRow.sunsetVipQty : 0,
            sunsetVipChildQty: typeof parsedRow.sunsetVipChildQty === 'number' ? parsedRow.sunsetVipChildQty : 0,
            sunsetVipAlcoholQty: typeof parsedRow.sunsetVipAlcoholQty === 'number' ? parsedRow.sunsetVipAlcoholQty : 0,

            lotusChildQty: typeof parsedRow.lotusChildQty === 'number' ? parsedRow.lotusChildQty : 0,
            lotusAdultQty: typeof parsedRow.lotusAdultQty === 'number' ? parsedRow.lotusAdultQty : 0,
            lotusVipQty: typeof parsedRow.lotusVipQty === 'number' ? parsedRow.lotusVipQty : 0,
            lotusVipChildQty: typeof parsedRow.lotusVipChildQty === 'number' ? parsedRow.lotusVipChildQty : 0,
            lotusVipAlcoholQty: typeof parsedRow.lotusVipAlcoholQty === 'number' ? parsedRow.lotusVipAlcoholQty : 0,

            royalQty: typeof parsedRow.royalQty === 'number' ? parsedRow.royalQty : 0,

            othersAmtCake: typeof parsedRow.othersAmtCake === 'number' ? parsedRow.othersAmtCake : 0,

            totalAmount: typeof parsedRow.totalAmount === 'number' ? parsedRow.totalAmount : 0,
            commissionPercentage: typeof parsedRow.commissionPercentage === 'number' ? parsedRow.commissionPercentage : 0,
            commissionAmount: typeof parsedRow.commissionAmount === 'number' ? parsedRow.commissionAmount : 0,
            netAmount: typeof parsedRow.netAmount === 'number' ? parsedRow.netAmount : 0,
            paidAmount: typeof parsedRow.paidAmount === 'number' ? parsedRow.paidAmount : 0,
            balanceAmount: typeof parsedRow.balanceAmount === 'number' ? parsedRow.balanceAmount : 0,

            createdAt: typeof parsedRow.createdAt === 'string' && parsedRow.createdAt.trim() !== '' ? parsedRow.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (i === 1) {
             console.log("First Full Lead Object (after defaults):", JSON.parse(JSON.stringify(fullLead)));
          }

          const isDuplicateInExisting = existingLeadIds.has(fullLead.id);
          const isDuplicateInThisBatch = newLeadsFromCsv.some(l => l.id === fullLead.id);

          if (!isDuplicateInExisting && !isDuplicateInThisBatch) {
            newLeadsFromCsv.push(fullLead);
            existingLeadIds.add(fullLead.id); // Add to set to check against within this batch
          } else {
            console.warn(`Skipping import for lead with duplicate ID: ${fullLead.id} at CSV row ${i + 1}. Line: "${lines[i]}"`);
            skippedCount++;
          }
        }

        if (newLeadsFromCsv.length > 0) {
          // Post each new lead to the backend
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
                console.warn(`Failed to import lead ${leadToImport.id}: ${errorData.message || response.statusText}`);
                skippedCount++;
              }
            } catch (apiError) {
                console.warn(`API error importing lead ${leadToImport.id}:`, apiError);
                skippedCount++;
            }
          }
          
          fetchLeads(); // Re-fetch all leads after import attempts

          if (successCount > 0 && skippedCount === 0) {
            toast({ title: 'Import Successful', description: `${successCount} new leads imported.` });
          } else if (successCount > 0 && skippedCount > 0) {
             toast({ title: 'Import Partially Completed', description: `${successCount} new leads imported, ${skippedCount} CSV rows/leads were skipped. Check console.`, variant: 'default' });
          } else if (successCount === 0 && skippedCount > 0) {
             toast({
                title: 'Import Failed',
                description: `All ${skippedCount} valid data rows from CSV were skipped during API submission or due to duplicates. Check console for details.`,
                variant: 'destructive'
            });
          } else {
             toast({ title: 'Import Complete', description: 'No new leads were imported (file had no valid data rows or all were duplicates). Check console.' });
          }

        } else if (skippedCount === lines.length -1 && lines.length > 1) {
           toast({
            title: 'Import Failed',
            description: `All ${lines.length - 1} data rows were skipped during parsing. Please check your CSV file. Common issues: column count mismatch with header, or incorrect delimiter (must be comma). Ensure IDs in CSV are unique if provided. Check console for details on skipped rows.`,
            variant: 'destructive'
          });
        }
         else {
          toast({ title: 'Import Complete', description: 'No new leads were imported (possibly all duplicates or file had no valid data rows after header). Check console for details.' });
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

  const handleCsvExport = () => {
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
      'commissionAmount', 'netAmount', 'paidAmount', 'balanceAmount', 'createdAt', 'updatedAt'
    ];

    const escapeCsvCell = (cellData: any): string => {
      if (cellData === null || cellData === undefined) {
        return '';
      }
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

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
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
                    onCsvExport={handleCsvExport} // Added prop for export handler
                  />}
      />
      <LeadsTable leads={leads} onEditLead={handleEditLeadClick} onDeleteLead={handleDeleteLead} />
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
