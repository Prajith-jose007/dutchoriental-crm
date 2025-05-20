
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';
import { LeadFormDialog } from './_components/LeadFormDialog';
import type { Lead } from '@/lib/types';
import { placeholderLeads as initialLeads } from '@/lib/placeholder-data';

export default function LeadsPage() {
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);

  // Effect to update table if initialLeads changes (e.g. hot reload)
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
    if (editingLead) {
      // Update existing lead
      setLeads(prevLeads => 
        prevLeads.map(l => l.id === submittedLeadData.id ? submittedLeadData : l)
      );
    } else {
      // Add new lead
      setLeads(prevLeads => [...prevLeads, submittedLeadData]);
    }
    setIsLeadDialogOpen(false);
    setEditingLead(null);
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Leads Management"
        description="Track and manage all your sales leads."
        actions={<ImportExportButtons onAddLeadClick={handleAddLeadClick} />}
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
