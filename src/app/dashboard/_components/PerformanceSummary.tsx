'use client';

import { useMemo } from 'react';
import { Users, Banknote, Ticket, BookOpen, Activity, CheckCircle, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function SummaryCard({ title, value, description, icon, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface CrmSummaryProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: string | null;
}

export function PerformanceSummary({ leads, isLoading, error }: CrmSummaryProps) {
  const summaryData = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter(lead => lead.status === 'Unconfirmed' || lead.status === 'Confirmed').length;
    const closedWon = leads.filter(lead => lead.status === 'Closed (Won)').length;
    const closedLost = leads.filter(lead => lead.status === 'Closed (Lost)').length;
    
    return {
      totalLeads,
      activeLeads,
      closedWon,
      closedLost,
    };
  }, [leads]);


  const leadsError = error && leads.length === 0 ? error : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Leads"
        value={leadsError ? 'Error' : summaryData.totalLeads.toLocaleString()}
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "All bookings in the system"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Active Leads"
        value={leadsError ? 'Error' : summaryData.activeLeads.toLocaleString()}
        icon={<Activity className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Bookings that are 'Unconfirmed' or 'Confirmed'"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Closed (Won)"
        value={leadsError ? 'Error' : summaryData.closedWon.toLocaleString()}
        icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Successfully completed bookings"}
        isLoading={isLoading}
      />
       <SummaryCard
        title="Closed (Lost)"
        value={leadsError ? 'Error' : summaryData.closedLost.toLocaleString()}
        icon={<XCircle className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Bookings that were cancelled or lost"}
        isLoading={isLoading}
      />
    </div>
  );
}
