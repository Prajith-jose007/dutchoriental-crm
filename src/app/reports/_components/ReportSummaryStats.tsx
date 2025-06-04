
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BookOpenCheck, BookOpen, Wallet, Activity } from 'lucide-react'; // Added Activity

interface SummaryStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function SummaryStatCard({ title, value, icon, isLoading }: SummaryStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

interface ReportSummaryStatsProps {
  filteredLeads: Lead[];
  isLoading?: boolean;
  error?: string | null;
}

export function ReportSummaryStats({ filteredLeads, isLoading, error }: ReportSummaryStatsProps) {
  const summaryData = useMemo(() => {
    const closedLeads = filteredLeads.filter(lead => lead.status === 'Closed');
    const activeLeads = filteredLeads.filter(lead => lead.status === 'Active'); // Changed from 'Balance'

    const totalRevenue = closedLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    const totalBookings = filteredLeads.length;
    const closedBookingsCount = closedLeads.length;
    const activeLeadsCount = activeLeads.length;
    const totalBalanceAmountFromActive = activeLeads.reduce((sum, lead) => sum + Math.abs(lead.balanceAmount || 0), 0);

    return {
      totalRevenue,
      totalBookings,
      closedBookingsCount,
      activeLeadsCount,
      totalBalanceAmountFromActive,
    };
  }, [filteredLeads]);

  if (error) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6"> {/* Adjusted to 5 columns */}
            {[...Array(5)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stat Error</CardTitle></CardHeader>
                    <CardContent><p className="text-destructive text-xs">{error}</p></CardContent>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6"> {/* Adjusted to 5 columns */}
      <SummaryStatCard
        title="Total Revenue (Filtered)"
        value={`${summaryData.totalRevenue.toLocaleString()} AED`}
        icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Total Leads (Filtered)"
        value={summaryData.totalBookings}
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
       <SummaryStatCard
        title="Active Leads (Filtered)"
        value={summaryData.activeLeadsCount}
        icon={<Activity className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Closed Leads (Filtered)"
        value={summaryData.closedBookingsCount}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Balance (Active Leads)"
        value={`${summaryData.totalBalanceAmountFromActive.toLocaleString()} AED`}
        icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
    </div>
  );
}
