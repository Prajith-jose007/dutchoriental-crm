
'use client';

import { useMemo } from 'react';
import { DollarSign, TrendingUp, CalendarDays } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, parseISO, isValid, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

interface RevenueCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function RevenueCard({ title, value, description, icon, isLoading }: RevenueCardProps) {
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

interface RevenueSummaryProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: string | null;
}

export function RevenueSummary({ leads, isLoading, error }: RevenueSummaryProps) {
  const revenueData = useMemo(() => {
    const now = new Date();

    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const currentYearStart = startOfYear(now);
    const currentYearEnd = endOfYear(now);

    let todaysRevenue = 0;
    let thisMonthsRevenue = 0;
    let thisYearsRevenue = 0;

    leads.forEach(lead => {
      // Revenue is now calculated from 'Closed (Won)' leads only
      if (lead.status === 'Closed (Won)' && typeof lead.netAmount === 'number') {
        try {
          let eventDate: Date | null = null;
          if (lead.month && isValid(parseISO(lead.month))) {
            eventDate = parseISO(lead.month);
          }

          if (eventDate) {
            if (isWithinInterval(eventDate, { start: currentYearStart, end: currentYearEnd })) {
              thisYearsRevenue += lead.netAmount;
            }
            if (isWithinInterval(eventDate, { start: currentMonthStart, end: currentMonthEnd })) {
              thisMonthsRevenue += lead.netAmount;
            }
          }

          if (lead.createdAt) {
            const leadCreationDate = parseISO(lead.createdAt);
            if (isValid(leadCreationDate) && isToday(leadCreationDate)) {
              todaysRevenue += lead.netAmount; // Today's revenue based on creation of 'Closed (Won)' leads
            }
          }
        } catch (e) {
          console.warn(`Error processing date for lead ${lead.id} in revenue calculation: `, e)
        }
      }
    });

    return [
      { period: "Today's Revenue", amount: todaysRevenue, icon: <DollarSign className="h-5 w-5 text-muted-foreground" />, description: "Based on &apos;Closed (Won)&apos; bookings created today" },
      { period: "This Month's Revenue", amount: thisMonthsRevenue, icon: <CalendarDays className="h-5 w-5 text-muted-foreground" />, description: "Based on &apos;Closed (Won)&apos; bookings with event date this month" },
      { period: "This Year's Revenue", amount: thisYearsRevenue, icon: <TrendingUp className="h-5 w-5 text-muted-foreground" />, description: "Based on &apos;Closed (Won)&apos; bookings with event date this year" },
    ];
  }, [leads]);

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {revenueData.map(item => (
          <Card key={item.period}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.period}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent><p className="text-destructive pt-2">Error: {error}</p></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {revenueData.map((item) => (
        <RevenueCard
          key={item.period}
          title={item.period}
          value={`${item.amount.toLocaleString()} AED`}
          description={item.description}
          icon={item.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
