
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead } from '@/lib/types';
import { placeholderLeads as initialLeads } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert string values to their appropriate types
// This is a simplified version and might need more robust error handling/validation
const convertValue = (key: keyof Lead, value: string): any => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  switch (key) {
    case 'free':
      return value.toLowerCase() === 'true';
    case 'dhowChild89':
    case 'dhowFood99':
    case 'dhowDrinks199':
    case 'dhowVip299':
    case 'oeChild129':
    case 'oeFood149':
    case 'oeDrinks249':
    case 'oeVip349':
    case 'sunsetChild179':
    case 'sunsetFood199':
    case 'sunsetDrinks299':
    case 'lotusFood249':
    case 'lotusDrinks349':
    case 'lotusVip399':
    case 'lotusVip499':
    case 'othersAmtCake':
    case 'quantity':
    case 'rate':
    case 'totalAmount':
    case 'commissionPercentage':
    case 'commissionAmount':
    case 'netAmount':
    case 'paidAmount':
    case 'balanceAmount':
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num; // Default to 0 if parsing fails
    default:
      return value;
  }
};


export default function LeadsPage() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const { toast } = useToast();

  // Effect to update table if initialLeads changes (e.g. hot reload or CSV import)
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
      // Update existing lead in both state and initialLeads
      initialLeads[existingLeadIndex] = submittedLeadData;
      setLeads(prevLeads => 
        prevLeads.map(l => l.id === submittedLeadData.id ? submittedLeadData : l)
      );
    } else if (!editingLead && existingLeadIndex === -1) { // Ensure new lead ID doesn't already exist
      // Add new lead to both state and initialLeads
      initialLeads.push(submittedLeadData);
      setLeads(prevLeads => [...prevLeads, submittedLeadData]);
    } else if (!editingLead && existingLeadIndex !== -1) {
      toast({
        title: 'Error Adding Lead',
        description: `A lead with ID ${submittedLeadData.id} already exists. Please use a unique ID.`,
        variant: 'destructive',
      });
      return; // Prevent adding duplicate ID
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
        const lines = csvText.split(/\r\n|\n/);
        if (lines.length < 2) {
          toast({ title: 'Import Error', description: 'CSV file must have a header and at least one data row.', variant: 'destructive' });
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim() as keyof Lead);
        const newLeads: Lead[] = [];

        for (let i = 1; i < lines.length; i++) {
          const data = lines[i].split(',');
          if (data.length !== headers.length || lines[i].trim() === '') {
            console.warn(`Skipping malformed or empty CSV line: ${i + 1}`);
            continue;
          }

          const leadObject = {} as Partial<Lead>;
          headers.forEach((header, index) => {
            leadObject[header] = convertValue(header, data[index]?.trim());
          });
          
          // Basic validation: ensure an ID exists
          if (!leadObject.id) {
            leadObject.id = `imported-lead-${Date.now()}-${i}`; // Generate a fallback ID
             toast({ title: 'Import Warning', description: `Lead at row ${i+1} was missing an ID and one was generated.`, variant: 'default' });
          }
          
          // Add default values for any missing required fields (example for status, month, clientName, etc.)
          // This needs to be comprehensive based on your Lead type definition.
          const fullLead: Lead = {
            id: leadObject.id,
            agent: leadObject.agent || '',
            status: leadObject.status || 'New',
            month: leadObject.month || new Date().toISOString().slice(0,7),
            yacht: leadObject.yacht || '',
            type: leadObject.type || 'Imported',
            clientName: leadObject.clientName || 'N/A',
            totalAmount: leadObject.totalAmount || 0,
            commissionPercentage: leadObject.commissionPercentage || 0,
            netAmount: leadObject.netAmount || 0,
            paidAmount: leadObject.paidAmount || 0,
            balanceAmount: leadObject.balanceAmount || 0,
            createdAt: leadObject.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Add other fields from leadObject or defaults as necessary
            ...leadObject, // Spread remaining parsed fields
          };


          // Check if lead with this ID already exists in initialLeads
          if (!initialLeads.find(l => l.id === fullLead.id)) {
            newLeads.push(fullLead);
          } else {
            console.warn(`Skipping import for lead with duplicate ID: ${fullLead.id}`);
             toast({ title: 'Import Warning', description: `Lead with ID ${fullLead.id} already exists and was skipped.`, variant: 'default' });
          }
        }

        if (newLeads.length > 0) {
          initialLeads.push(...newLeads); // Add to the placeholder data source
          setLeads(prevLeads => [...prevLeads, ...newLeads]); // Update current state
          toast({ title: 'Import Successful', description: `${newLeads.length} leads imported.` });
        } else {
          toast({ title: 'Import Complete', description: 'No new leads were imported (possibly all duplicates or empty file after header).' });
        }

      } catch (error) {
        console.error("CSV Parsing Error:", error);
        toast({ title: 'Import Error', description: 'Failed to parse CSV file. Check console for details.', variant: 'destructive' });
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
