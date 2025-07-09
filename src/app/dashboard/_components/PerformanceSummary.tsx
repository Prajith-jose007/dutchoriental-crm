
'use client';

import { useMemo } from 'react';
import { BookOpenCheck, Banknote, CircleDollarSign, Wallet, BookOpen, Activity, CalendarClock, Hourglass } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead, Invoice } from '@/lib/types';
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

interface PerformanceSummaryProps {
  leads: Lead[];
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
}

export function PerformanceSummary({ leads, invoices, isLoading, error }: PerformanceSummaryProps) {
  const summaryData = useMemo(() => {
    const closedLeads = leads.filter(lead => lead.status === 'Closed');
    const upcomingLeads = leads.filter(lead => lead.status === 'Upcoming');
    const balanceLeads = leads.filter(lead => lead.status === 'Balance');

    const totalLeadsCount = leads.length;
    const upcomingLeadsCount = upcomingLeads.length;
    const balanceLeadsCount = balanceLeads.length;
    const closedLeadsCount = closedLeads.length;

    const revenueFromClosedLeads = closedLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    const outstandingBalanceFromBalanceLeads = balanceLeads.reduce((sum, lead) => sum + (lead.balanceAmount || 0), 0);

    return {
      totalLeadsCount,
      upcomingLeadsCount,
      balanceLeadsCount,
      closedLeadsCount,
      revenueFromClosedLeads,
      outstandingBalanceFromBalanceLeads,
    };
  }, [leads]);


  const leadsError = error && leads.length === 0 ? error : null;


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <SummaryCard
        title="Total Bookings"
        value={leadsError ? 'Error' : summaryData.totalLeadsCount}
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "All bookings regardless of status"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Upcoming Bookings"
        value={leadsError ? 'Error' : summaryData.upcomingLeadsCount}
        icon={<CalendarClock className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Bookings scheduled for the future"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Balance Bookings"
        value={leadsError ? 'Error' : summaryData.balanceLeadsCount}
        icon={<Hourglass className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Bookings with outstanding payments"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Closed Bookings"
        value={leadsError ? 'Error' : summaryData.closedLeadsCount}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Completed and paid bookings"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Revenue (Closed)"
        value={leadsError ? 'Error' : `${summaryData.revenueFromClosedLeads.toLocaleString()} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Sum of net amounts (Closed bookings)"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Outstanding (Balance)"
        value={leadsError ? 'Error' : `${summaryData.outstandingBalanceFromBalanceLeads.toLocaleString()} AED`}
        icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Sum of balance (Balance bookings)"}
        isLoading={isLoading}
      />
    </div>
  );
}
