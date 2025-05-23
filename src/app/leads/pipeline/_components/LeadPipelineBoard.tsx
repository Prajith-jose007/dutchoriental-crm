
'use client';

import type { Lead, LeadStatus } from '@/lib/types';
import { LeadCard } from './LeadCard';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LeadPipelineBoardProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void; // Added prop for handling edit/view
}

const leadStatuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Closed Won', 'Closed Lost'];

export function LeadPipelineBoard({ leads, onEditLead }: LeadPipelineBoardProps) {
  const leadsByStatus: { [key in LeadStatus]?: Lead[] } = {};
  leadStatuses.forEach(status => leadsByStatus[status] = []);

  leads.forEach(lead => {
    if (leadsByStatus[lead.status]) {
      leadsByStatus[lead.status]?.push(lead);
    } else {
      if (!leadsByStatus['New']) leadsByStatus['New'] = [];
      leadsByStatus['New']?.push(lead); 
    }
  });

  return (
    <ScrollArea className="flex-1 w-full pb-4">
      <div className="flex gap-4 p-1">
        {leadStatuses.map(status => (
          <div key={status} className="min-w-[300px] w-1/6 bg-muted/60 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10">
              {status} ({leadsByStatus[status]?.length || 0})
            </h2>
            <ScrollArea className="h-[calc(100vh-220px)]"> {/* Adjust height as needed */}
              <div className="p-4 space-y-4">
                {leadsByStatus[status]?.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">No leads in this stage.</p>
                ) : (
                  leadsByStatus[status]?.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onEditLead={onEditLead} /> // Pass onEditLead to LeadCard
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
