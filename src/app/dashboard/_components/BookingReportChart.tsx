
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
import type { BookingReportData, Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, parseISO, isValid } from 'date-fns';

const chartConfig = {
  bookings: {
    label: 'Bookings',
    color: 'hsl(var(--chart-1))',
  },
};

interface BookingReportChartProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: string | null;
}

export function BookingReportChart({ leads, isLoading, error }: BookingReportChartProps) {
  const chartData: BookingReportData[] = useMemo(() => {
    const monthlyBookings: { [monthYear: string]: number } = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthYearKey = format(date, 'yyyy-MM'); 
      monthlyBookings[monthYearKey] = 0;
    }
    
    leads.forEach(lead => {
      // Assuming 'Closed (Won)' status now signifies a completed/successful booking for reporting
      if (lead.status === 'Closed (Won)' && lead.month) {
        try {
          const eventDate = parseISO(lead.month);
          if (isValid(eventDate)) {
            const leadMonthYear = format(eventDate, 'yyyy-MM');
            if (monthlyBookings.hasOwnProperty(leadMonthYear)) {
                monthlyBookings[leadMonthYear]++;
            }
          } else {
            console.warn(`Invalid event date found for lead ${lead.id}: ${lead.month}`);
          }
        } catch (e) {
          console.warn(`Error parsing event date for lead ${lead.id}: ${lead.month}`, e);
        }
      }
    });

    return Object.entries(monthlyBookings)
      .map(([monthYear, bookings]) => ({
        month: format(parseISO(monthYear + '-01'), 'MMM yyyy'), 
        bookings,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  }, [leads]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Reports</CardTitle>
          <CardDescription>Monthly 'Closed (Won)' booking trends for the last 7 months.</CardDescription>
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
                <CardTitle>Booking Reports</CardTitle>
                <CardDescription>Monthly 'Closed (Won)' booking trends for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-destructive">Error loading booking report data: {error}</p>
            </CardContent>
        </Card>
    );
  }
  
  if (chartData.length === 0 && !isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Booking Reports</CardTitle>
                <CardDescription>Monthly 'Closed (Won)' booking trends for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No 'Closed (Won)' booking data available for the selected period or filters.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Reports</CardTitle>
        <CardDescription>Monthly 'Closed (Won)' booking trends for the last 7 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis allowDecimals={false}/>
            <RechartsTooltip 
                cursor={true} 
                content={<ChartTooltipContent />} 
            />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="var(--color-bookings)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
