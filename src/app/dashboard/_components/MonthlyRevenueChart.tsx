'use client';

import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, parseISO, isValid } from 'date-fns';

const chartConfig = {
  revenue: {
    label: 'Revenue (AED)',
    color: 'hsl(var(--chart-3))', // Using chart-3 for revenue
  },
};

interface MonthlyRevenueChartProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: string | null;
}

export function MonthlyRevenueChart({ leads, isLoading, error }: MonthlyRevenueChartProps) {
  const chartData: { month: string; revenue: number }[] = useMemo(() => {
    const monthlyRevenue: { [monthYear: string]: number } = {};
    const today = new Date();

    // Initialize months for the last 7 months
    for (let i = 6; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthYearKey = format(date, 'yyyy-MM'); 
      monthlyRevenue[monthYearKey] = 0;
    }
    
    leads.forEach(lead => {
      if (lead.status === 'Closed' && lead.month && typeof lead.netAmount === 'number') {
        try {
          const eventDate = parseISO(lead.month);
          if (isValid(eventDate)) {
            const leadMonthYear = format(eventDate, 'yyyy-MM');
            if (monthlyRevenue.hasOwnProperty(leadMonthYear)) {
                monthlyRevenue[leadMonthYear] += lead.netAmount;
            }
          } else {
            console.warn(`Invalid event date found for lead ${lead.id}: ${lead.month}`);
          }
        } catch (e) {
          console.warn(`Error parsing event date for lead ${lead.id}: ${lead.month}`, e);
        }
      }
    });

    return Object.entries(monthlyRevenue)
      .map(([monthYear, revenue]) => ({
        month: format(parseISO(monthYear + '-01'), 'MMM yyyy'), // Display as "Jan 2024"
        revenue,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  }, [leads]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Revenue from 'Closed' bookings over the last 7 months.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] space-y-3 py-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-4/6" />
          <Skeleton className="h-8 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue from 'Closed' bookings over the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-destructive">Error loading monthly revenue data: {error}</p>
            </CardContent>
        </Card>
    );
  }
  
  if (chartData.every(d => d.revenue === 0) && !isLoading) { // Check if all revenue values are zero
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue from 'Closed' bookings over the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No revenue data from 'Closed' bookings for the selected period.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>Revenue (Net Amount) from 'Closed' bookings over the last 7 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)} // "Jan", "Feb", etc.
            />
            <YAxis 
                tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`} // Format as 10k, 20k
                allowDecimals={false}
            />
            <RechartsTooltip 
                cursor={true} 
                content={<ChartTooltipContent formatter={(value) => `${Number(value).toLocaleString()} AED`} />} 
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
