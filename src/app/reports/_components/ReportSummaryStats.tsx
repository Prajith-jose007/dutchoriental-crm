
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, BookOpenCheck, BookOpen, Wallet, Activity, CalendarClock, Hourglass } from 'lucide-react';

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
    const upcomingLeads = filteredLeads.filter(lead => lead.status === 'Upcoming');
    const balanceLeads = filteredLeads.filter(lead => lead.status === 'Balance');

    const totalRevenue = closedLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    const totalBookings = filteredLeads.length;
    const upcomingLeadsCount = upcomingLeads.length;
    const balanceLeadsCount = balanceLeads.length;
    const closedBookingsCount = closedLeads.length;
    const totalOutstandingBalance = balanceLeads.reduce((sum, lead) => sum + (lead.balanceAmount || 0), 0);

    return {
      totalRevenue,
      totalBookings,
      upcomingLeadsCount,
      balanceLeadsCount,
      closedBookingsCount,
      totalOutstandingBalance,
    };
  }, [filteredLeads]);

  if (error) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
            {[...Array(6)].map((_, i) => (
                 <Card key={i}>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stat Error</CardTitle></CardHeader>
                    <CardContent><p className="text-destructive text-xs">{error}</p></CardContent>
                </Card>
            ))}
        </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
      <SummaryStatCard
        title="Total Bookings (Filtered)"
        value={summaryData.totalBookings}
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Upcoming Bookings (Filtered)"
        value={summaryData.upcomingLeadsCount}
        icon={<CalendarClock className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
       <SummaryStatCard
        title="Balance Bookings (Filtered)"
        value={summaryData.balanceLeadsCount}
        icon={<Hourglass className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Closed Bookings (Filtered)"
        value={summaryData.closedBookingsCount}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Revenue (Filtered)"
        value={`${summaryData.totalRevenue.toLocaleString()} AED`}
        icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
      <SummaryStatCard
        title="Outstanding (Balance Bookings)"
        value={`${summaryData.totalOutstandingBalance.toLocaleString()} AED`}
        icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        isLoading={isLoading}
      />
    </div>
  );
}
