
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead, LeadStatus, PackageType } from '@/lib/types';
import { placeholderLeads as initialLeads } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert string values to their appropriate types
const convertValue = (key: keyof Lead, value: string): any => {
  const trimmedValue = value ? value.trim() : '';

  if (trimmedValue === '' || value === null || value === undefined) {
    switch (key) {
        // case 'free': return false; // Removed free
        case 'dhowChild89': case 'dhowFood99': case 'dhowDrinks199': case 'dhowVip299':
        case 'oeChild129': case 'oeFood149': case 'oeDrinks249': case 'oeVip349':
        case 'sunsetChild179': case 'sunsetFood199': case 'sunsetDrinks299':
        case 'lotusFood249': case 'lotusDrinks349': case 'lotusVip399': case 'lotusVip499':
        case 'othersAmtCake': case 'quantity': case 'rate': case 'totalAmount':
        case 'commissionPercentage': case 'commissionAmount': case 'netAmount':
        case 'paidAmount': case 'balanceAmount':
            return 0;
        default: return undefined;
    }
  }

  switch (key) {
    // case 'free': // Removed free
    //   return trimmedValue.toLowerCase() === 'true';
    case 'dhowChild89': case 'dhowFood99': case 'dhowDrinks199': case 'dhowVip299':
    case 'oeChild129': case 'oeFood149': case 'oeDrinks249': case 'oeVip349':
    case 'sunsetChild179': case 'sunsetFood199': case 'sunsetDrinks299':
    case 'lotusFood249': case 'lotusDrinks349': case 'lotusVip399': case 'lotusVip499':
    case 'othersAmtCake': case 'quantity': case 'rate': case 'totalAmount':
    case 'commissionPercentage': case 'commissionAmount': case 'netAmount':
    case 'paidAmount': case 'balanceAmount':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? 0 : num;
    default:
      return trimmedValue; // Return trimmed string for other fields
  }
};


export default function LeadsPage() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setLeads(initialLeads);
  }, []);


  const handleAddLeadClick = () => {
    setEditingLead(null);
    setIsLeadDialogOpen(true);
  };

  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleLeadFormSubmit = (submittedLeadData: Lead) => {
    const existingLeadIndex = initialLeads.findIndex(l => l.id === submittedLeadData.id);
    if (editingLead && existingLeadIndex !== -1) {
      initialLeads[existingLeadIndex] = submittedLeadData;
      setLeads(prevLeads =>
        prevLeads.map(l => l.id === submittedLeadData.id ? submittedLeadData : l)
      );
    } else if (!editingLead && existingLeadIndex === -1) {
      if (initialLeads.some(l => l.id === submittedLeadData.id) || leads.some(l => l.id === submittedLeadData.id)) {
        toast({
          title: 'Error Adding Lead',
          description: `A lead with ID ${submittedLeadData.id} already exists. Please use a unique ID.`,
          variant: 'destructive',
        });
        return;
      }
      initialLeads.push(submittedLeadData);
      setLeads(prevLeads => [...prevLeads, submittedLeadData]);
    } else if (!editingLead && existingLeadIndex !== -1) {
      toast({
        title: 'Error Adding Lead',
        description: `A lead with ID ${submittedLeadData.id} already exists. This should not happen if IDs are unique.`,
        variant: 'destructive',
      });
      return;
    }
    setIsLeadDialogOpen(false);
    setEditingLead(null);
  };

  const handleCsvImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
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
        if (headerLine.charCodeAt(0) === 0xFEFF) { // Check for BOM
            headerLine = headerLine.substring(1);
        }
        const headers = headerLine.split(',').map(h => h.trim() as keyof Lead);
        console.log("Parsed CSV Headers:", headers); // Diagnostic log

        const newLeadsFromCsv: Lead[] = [];
        let skippedCount = 0;

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

          if (i === 1) { // Log first parsed data row for diagnostics
            console.log("First Parsed Data Row (raw values from CSV after convertValue):", JSON.parse(JSON.stringify(parsedRow)));
          }

          let leadId = typeof parsedRow.id === 'string' && parsedRow.id.trim() !== '' ? parsedRow.id.trim() : undefined;

          if (!leadId) {
            const baseGeneratedId = `imported-lead-${Date.now()}-${i}`;
            let currentGeneratedId = baseGeneratedId;
            let uniqueIdCounter = 0;

            while (initialLeads.some(l => l.id === currentGeneratedId) ||
                   leads.some(l => l.id === currentGeneratedId) ||
                   newLeadsFromCsv.some(l => l.id === currentGeneratedId)) {
                uniqueIdCounter++;
                currentGeneratedId = `${baseGeneratedId}-${uniqueIdCounter}`;
            }
            leadId = currentGeneratedId;

            if (uniqueIdCounter > 0) {
                 toast({ title: 'Import Info', description: `Lead at CSV row ${i+1} generated a duplicate ID. New unique ID assigned: ${leadId}.`, variant: 'default' });
            } else {
                 toast({ title: 'Import Info', description: `Lead at CSV row ${i+1} was missing an ID and one was generated: ${leadId}.`, variant: 'default' });
            }
          }


          const fullLead: Lead = {
            id: leadId,
            agent: typeof parsedRow.agent === 'string' ? parsedRow.agent : '',
            status: (parsedRow.status as LeadStatus) || 'New',
            month: typeof parsedRow.month === 'string' && parsedRow.month.match(/^\d{4}-\d{2}$/) ? parsedRow.month : new Date().toISOString().slice(0,7),
            yacht: typeof parsedRow.yacht === 'string' ? parsedRow.yacht : '',
            type: typeof parsedRow.type === 'string' && parsedRow.type.trim() !== '' ? parsedRow.type : 'Imported',
            packageType: (parsedRow.packageType as PackageType) || '',
            clientName: typeof parsedRow.clientName === 'string' && parsedRow.clientName.trim() !== '' ? parsedRow.clientName : 'N/A',
            invoiceId: typeof parsedRow.invoiceId === 'string' ? parsedRow.invoiceId : undefined,
            // free: typeof parsedRow.free === 'boolean' ? parsedRow.free : false, // Removed free

            dhowChild89: typeof parsedRow.dhowChild89 === 'number' ? parsedRow.dhowChild89 : 0,
            dhowFood99: typeof parsedRow.dhowFood99 === 'number' ? parsedRow.dhowFood99 : 0,
            dhowDrinks199: typeof parsedRow.dhowDrinks199 === 'number' ? parsedRow.dhowDrinks199 : 0,
            dhowVip299: typeof parsedRow.dhowVip299 === 'number' ? parsedRow.dhowVip299 : 0,
            oeChild129: typeof parsedRow.oeChild129 === 'number' ? parsedRow.oeChild129 : 0,
            oeFood149: typeof parsedRow.oeFood149 === 'number' ? parsedRow.oeFood149 : 0,
            oeDrinks249: typeof parsedRow.oeDrinks249 === 'number' ? parsedRow.oeDrinks249 : 0,
            oeVip349: typeof parsedRow.oeVip349 === 'number' ? parsedRow.oeVip349 : 0,
            sunsetChild179: typeof parsedRow.sunsetChild179 === 'number' ? parsedRow.sunsetChild179 : 0,
            sunsetFood199: typeof parsedRow.sunsetFood199 === 'number' ? parsedRow.sunsetFood199 : 0,
            sunsetDrinks299: typeof parsedRow.sunsetDrinks299 === 'number' ? parsedRow.sunsetDrinks299 : 0,
            lotusFood249: typeof parsedRow.lotusFood249 === 'number' ? parsedRow.lotusFood249 : 0,
            lotusDrinks349: typeof parsedRow.lotusDrinks349 === 'number' ? parsedRow.lotusDrinks349 : 0,
            lotusVip399: typeof parsedRow.lotusVip399 === 'number' ? parsedRow.lotusVip399 : 0,
            lotusVip499: typeof parsedRow.lotusVip499 === 'number' ? parsedRow.lotusVip499 : 0,
            othersAmtCake: typeof parsedRow.othersAmtCake === 'number' ? parsedRow.othersAmtCake : 0,

            quantity: typeof parsedRow.quantity === 'number' ? parsedRow.quantity : 0,
            rate: typeof parsedRow.rate === 'number' ? parsedRow.rate : 0,

            totalAmount: typeof parsedRow.totalAmount === 'number' ? parsedRow.totalAmount : 0,
            commissionPercentage: typeof parsedRow.commissionPercentage === 'number' ? parsedRow.commissionPercentage : 0,
            commissionAmount: typeof parsedRow.commissionAmount === 'number' ? parsedRow.commissionAmount : 0,
            netAmount: typeof parsedRow.netAmount === 'number' ? parsedRow.netAmount : 0,
            paidAmount: typeof parsedRow.paidAmount === 'number' ? parsedRow.paidAmount : 0,
            balanceAmount: typeof parsedRow.balanceAmount === 'number' ? parsedRow.balanceAmount : 0,

            createdAt: typeof parsedRow.createdAt === 'string' && parsedRow.createdAt.trim() !== '' ? parsedRow.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          if (i === 1) { // Log first fully constructed lead object
             console.log("First Full Lead Object (after defaults):", JSON.parse(JSON.stringify(fullLead)));
          }

          const isDuplicateInInitial = initialLeads.some(l => l.id === fullLead.id);
          const isDuplicateInCurrentState = leads.some(l => l.id === fullLead.id);
          const isDuplicateInThisBatch = newLeadsFromCsv.some(l => l.id === fullLead.id);

          if (!isDuplicateInInitial && !isDuplicateInCurrentState && !isDuplicateInThisBatch) {
            newLeadsFromCsv.push(fullLead);
          } else {
            console.warn(`Skipping import for lead with duplicate ID: ${fullLead.id} at CSV row ${i + 1}. Line: "${lines[i]}"`);
            toast({ title: 'Import Warning', description: `Lead with ID ${fullLead.id} (CSV row ${i + 1}) already exists or is a duplicate in this file. Skipped.`, variant: 'default' });
            skippedCount++;
          }
        }

        if (skippedCount > 0 && newLeadsFromCsv.length > 0) {
            toast({ title: 'Import Partially Completed', description: `${newLeadsFromCsv.length} new leads imported, ${skippedCount} CSV rows were skipped. Check console for details.`, variant: 'default' });
        }


        if (newLeadsFromCsv.length > 0) {
          initialLeads.push(...newLeadsFromCsv);
          setLeads(prevLeads => [...prevLeads, ...newLeadsFromCsv]);

          if (skippedCount === 0) {
            toast({ title: 'Import Successful', description: `${newLeadsFromCsv.length} new leads imported.` });
          }
        } else if (skippedCount === lines.length -1 && lines.length > 1) {
           toast({
            title: 'Import Failed',
            description: `All ${lines.length - 1} data rows were skipped. Please check your CSV file. Common issues: column count mismatch with header, or incorrect delimiter (must be comma). Ensure IDs in CSV are unique if provided. Check console for details on skipped rows.`,
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
      'id', 'agent', 'status', 'month', 'yacht', 'type', 'invoiceId', 'packageType', 'clientName', // 'free', // Removed free
      'dhowChild89', 'dhowFood99', 'dhowDrinks199', 'dhowVip299',
      'oeChild129', 'oeFood149', 'oeDrinks249', 'oeVip349',
      'sunsetChild179', 'sunsetFood199', 'sunsetDrinks299',
      'lotusFood249', 'lotusDrinks349', 'lotusVip399', 'lotusVip499',
      'othersAmtCake', 'quantity', 'rate', 'totalAmount', 'commissionPercentage',
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
      <LeadsTable leads={leads} onEditLead={handleEditLeadClick} />
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
