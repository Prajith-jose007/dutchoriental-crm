
'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import type { Lead } from '@/lib/types';
import { LeadPipelineBoard } from './_components/LeadPipelineBoard';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeadPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
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
        console.error("Error fetching leads for pipeline:", error);
        toast({ title: 'Error Fetching Leads', description: (error as Error).message, variant: 'destructive' });
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, [toast]);

  return (
    <div className="container mx-auto py-2 flex flex-col h-full">
      <PageHeader
        title="Lead Pipeline"
        description="Visualize your leads across different stages."
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
            <p className="text-muted-foreground text-xl">No leads found to display in the pipeline.</p>
         </div>
      ) : (
        <LeadPipelineBoard leads={leads} />
      )}
    </div>
  );
}
