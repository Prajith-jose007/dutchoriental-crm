
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
  if (value === '' || value === null || value === undefined) {
    // For specific keys that are numbers or booleans, return a default if empty,
    // otherwise return undefined for optional strings or specific handling.
    switch (key) {
        case 'free': return false; // Default boolean
        case 'dhowChild89': case 'dhowFood99': case 'dhowDrinks199': case 'dhowVip299':
        case 'oeChild129': case 'oeFood149': case 'oeDrinks249': case 'oeVip349':
        case 'sunsetChild179': case 'sunsetFood199': case 'sunsetDrinks299':
        case 'lotusFood249': case 'lotusDrinks349': case 'lotusVip399': case 'lotusVip499':
        case 'othersAmtCake': case 'quantity': case 'rate': case 'totalAmount':
        case 'commissionPercentage': case 'commissionAmount': case 'netAmount':
        case 'paidAmount': case 'balanceAmount':
            // For CSV import, if a numeric field is empty, default to 0.
            return 0; 
        default: return undefined; // Let downstream logic handle undefined for optional or string fields
    }
  }
  // Explicit conversions
  switch (key) {
    case 'free':
      return value.toLowerCase() === 'true';
    case 'dhowChild89': case 'dhowFood99': case 'dhowDrinks199': case 'dhowVip299':
    case 'oeChild129': case 'oeFood149': case 'oeDrinks249': case 'oeVip349':
    case 'sunsetChild179': case 'sunsetFood199': case 'sunsetDrinks299':
    case 'lotusFood249': case 'lotusDrinks349': case 'lotusVip399': case 'lotusVip499':
    case 'othersAmtCake': case 'quantity': case 'rate': case 'totalAmount':
    case 'commissionPercentage': case 'commissionAmount': case 'netAmount':
    case 'paidAmount': case 'balanceAmount':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    default:
      return value;
  }
};


export default function LeadsPage() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]); // Initialize with empty array, useEffect will populate
  const { toast } = useToast();

  useEffect(() => {
    // Initialize leads from placeholder data on mount
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
      // Ensure new lead ID is unique before adding
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
    } else if (!editingLead && existingLeadIndex !== -1) { // Should not happen if ID is truly unique
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
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== ''); // Filter out empty lines
        if (lines.length < 2) {
          toast({ title: 'Import Error', description: 'CSV file must have a header and at least one data row.', variant: 'destructive' });
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim() as keyof Lead);
        const newLeadsFromCsv: Lead[] = []; // Renamed to avoid confusion with 'newLeads' state setter
        let skippedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',');
          if (data.length !== headers.length) {
            console.warn(`Skipping malformed CSV line ${i + 1}: Expected ${headers.length} columns, got ${data.length}. Line: "${lines[i]}"`);
            skippedCount++;
            continue;
          }

          const parsedRow = {} as Partial<Lead>;
          headers.forEach((header, index) => {
            parsedRow[header] = convertValue(header, data[index]?.trim());
          });
          
          let leadId = parsedRow.id || `imported-lead-${Date.now()}-${i}`;
          
          // Ensure generated ID is unique if parsedRow.id was not present
          if (!parsedRow.id) {
            let counter = 0;
            let tempId = leadId;
            while (initialLeads.some(l => l.id === tempId) || leads.some(l => l.id === tempId) || newLeadsFromCsv.some(l => l.id === tempId)) {
                counter++;
                tempId = `imported-lead-${Date.now()}-${i}-${counter}`;
            }
            leadId = tempId;
            if (counter > 0) {
                 toast({ title: 'Import Warning', description: `Lead at row ${i+1} generated a duplicate ID. New ID assigned: ${leadId}.`, variant: 'default' });
            } else {
                 toast({ title: 'Import Warning', description: `Lead at row ${i+1} was missing an ID and one was generated: ${leadId}.`, variant: 'default' });
            }
          }


          const fullLead: Lead = {
            id: leadId,
            agent: typeof parsedRow.agent === 'string' ? parsedRow.agent : '',
            status: (parsedRow.status as LeadStatus) || 'New',
            month: typeof parsedRow.month === 'string' && parsedRow.month.match(/^\d{4}-\d{2}$/) ? parsedRow.month : new Date().toISOString().slice(0,7),
            yacht: typeof parsedRow.yacht === 'string' ? parsedRow.yacht : '',
            type: typeof parsedRow.type === 'string' ? parsedRow.type : 'Imported',
            packageType: (parsedRow.packageType as PackageType) || '',
            clientName: typeof parsedRow.clientName === 'string' ? parsedRow.clientName : 'N/A',
            quantity: typeof parsedRow.quantity === 'number' ? parsedRow.quantity : 0,
            rate: typeof parsedRow.rate === 'number' ? parsedRow.rate : 0,
            totalAmount: typeof parsedRow.totalAmount === 'number' ? parsedRow.totalAmount : 0,
            commissionPercentage: typeof parsedRow.commissionPercentage === 'number' ? parsedRow.commissionPercentage : 0,
            netAmount: typeof parsedRow.netAmount === 'number' ? parsedRow.netAmount : 0,
            paidAmount: typeof parsedRow.paidAmount === 'number' ? parsedRow.paidAmount : 0,
            balanceAmount: typeof parsedRow.balanceAmount === 'number' ? parsedRow.balanceAmount : 0,
            createdAt: typeof parsedRow.createdAt === 'string' ? parsedRow.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            invoiceId: parsedRow.invoiceId,
            free: typeof parsedRow.free === 'boolean' ? parsedRow.free : false,
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
            commissionAmount: typeof parsedRow.commissionAmount === 'number' ? parsedRow.commissionAmount : 0,
          };

          // Check for duplicates against initial data, current state, AND this batch
          const isDuplicateInInitial = initialLeads.some(l => l.id === fullLead.id);
          const isDuplicateInCurrentState = leads.some(l => l.id === fullLead.id);
          const isDuplicateInThisBatch = newLeadsFromCsv.some(l => l.id === fullLead.id);

          if (!isDuplicateInInitial && !isDuplicateInCurrentState && !isDuplicateInThisBatch) {
            newLeadsFromCsv.push(fullLead);
          } else {
            console.warn(`Skipping import for lead with duplicate ID: ${fullLead.id} at row ${i + 1}`);
            toast({ title: 'Import Warning', description: `Lead with ID ${fullLead.id} at row ${i + 1} already exists or is a duplicate in this file. Skipped.`, variant: 'default' });
            skippedCount++;
          }
        }

        if (skippedCount > 0) {
            toast({ title: 'Import Partially Completed', description: `${skippedCount} rows were skipped due to errors or duplicates.`, variant: 'default' });
        }

        if (newLeadsFromCsv.length > 0) {
          initialLeads.push(...newLeadsFromCsv); 
          setLeads(prevLeads => [...prevLeads, ...newLeadsFromCsv]); 
          toast({ title: 'Import Successful', description: `${newLeadsFromCsv.length} new leads imported.` });
        } else if (skippedCount === lines.length -1 && lines.length > 1) {
           toast({ title: 'Import Failed', description: 'All data rows were skipped. Please check your CSV file for issues.' });
        }
         else {
          toast({ title: 'Import Complete', description: 'No new leads were imported (possibly all duplicates or empty/invalid file after header).' });
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

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Leads Management"
        description="Track and manage all your sales leads."
        actions={<ImportExportButtons onAddLeadClick={handleAddLeadClick} onCsvImport={handleCsvImport} />}
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

