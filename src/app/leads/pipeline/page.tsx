
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import type { Lead } from '@/lib/types';
import { LeadPipelineBoard } from './_components/LeadPipelineBoard';
import { LeadFormDialog } from '../_components/LeadFormDialog'; // Import LeadFormDialog
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeadPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // State for LeadFormDialog
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }
      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching bookings for pipeline:", error);
      toast({ title: 'Error Fetching Bookings', description: (error as Error).message, variant: 'destructive' });
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [toast]); // Added toast to dependency array as it's used in fetchLeads

  const handleEditLeadClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsLeadDialogOpen(true);
  };

  const handleLeadFormSubmit = async (submittedLeadData: Lead) => {
    try {
      let response;
      // For pipeline view, we'll assume it's always an update since leads are pre-existing
      if (submittedLeadData.id) { 
        response = await fetch(`/api/leads/${submittedLeadData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedLeadData),
        });
      } else {
        // This case should ideally not happen if triggered from pipeline card
        toast({ title: 'Error', description: 'Booking ID missing for update.', variant: 'destructive' });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save booking: ${response.statusText}`);
      }
      
      toast({
        title: 'Booking Updated',
        description: `Booking for ${submittedLeadData.clientName} has been updated.`,
      });
      
      fetchLeads(); // Re-fetch all leads to update the pipeline
      setIsLeadDialogOpen(false);
      setEditingLead(null);

    } catch (error) {
      console.error("Error saving booking from pipeline:", error);
      toast({ title: 'Error Saving Booking', description: (error as Error).message, variant: 'destructive' });
    }
  };


  return (
    <div className="container mx-auto py-2 flex flex-col h-full">
      <PageHeader
        title="Leads Pipeline"
        description="Visualize your bookings across different stages."
      />
      {isLoading ? (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-muted/50 p-4 rounded-lg space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
         <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-xl">No bookings found to display in the pipeline.</p>
         </div>
      ) : (
        <LeadPipelineBoard leads={leads} onEditLead={handleEditLeadClick} />
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
