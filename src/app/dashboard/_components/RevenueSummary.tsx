
'use client';

import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, CalendarDays, Banknote } from 'lucide-react'; // Added Banknote for consistency
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead, RevenueData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, getMonth, getYear, isToday, parseISO } from 'date-fns';

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


export function RevenueSummary() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/leads');
        if (!response.ok) {
          throw new Error(`Failed to fetch leads for revenue: ${response.statusText}`);
        }
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching leads for RevenueSummary:", err);
        setError((err as Error).message);
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeadsData();
  }, []);

  const revenueData = useMemo(() => {
    const now = new Date();
    const currentMonth = getMonth(now); // 0-indexed
    const currentYear = getYear(now);
    const currentMonthYearStr = format(now, 'yyyy-MM');

    let todaysRevenue = 0;
    let thisMonthsRevenue = 0;
    let thisYearsRevenue = 0;

    leads.forEach(lead => {
      if (lead.status === 'Closed Won' && lead.netAmount) {
        try {
          // This Year's Revenue
          if (lead.month && lead.month.startsWith(String(currentYear))) {
            thisYearsRevenue += lead.netAmount;
          }

          // This Month's Revenue
          if (lead.month === currentMonthYearStr) {
            thisMonthsRevenue += lead.netAmount;
          }
          
          // Today's Revenue
          if (lead.createdAt) {
            const leadCreationDate = parseISO(lead.createdAt);
            if (isToday(leadCreationDate)) {
              todaysRevenue += lead.netAmount;
            }
          }
        } catch (e) {
            console.warn(`Error processing date for lead ${lead.id} in revenue calculation: `, e)
        }
      }
    });

    return [
      { period: "Today's Revenue", amount: todaysRevenue, icon: <DollarSign className="h-5 w-5 text-muted-foreground" />, description: "Based on 'Closed Won' leads created today" },
      { period: "This Month's Revenue", amount: thisMonthsRevenue, icon: <CalendarDays className="h-5 w-5 text-muted-foreground" />, description: "Based on 'Closed Won' leads this month" },
      { period: "This Year's Revenue", amount: thisYearsRevenue, icon: <TrendingUp className="h-5 w-5 text-muted-foreground" />, description: "Based on 'Closed Won' leads this year" },
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
            <CardContent><p className="text-destructive pt-2">Error loading data.</p></CardContent>
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
