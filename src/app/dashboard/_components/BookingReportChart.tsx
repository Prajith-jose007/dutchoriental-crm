
'use client';

import { useEffect, useState, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { BookingReportData, Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subMonths, getMonth, getYear } from 'date-fns';


const chartConfig = {
  bookings: {
    label: 'Bookings',
    color: 'hsl(var(--chart-1))',
  },
};

export function BookingReportChart() {
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
          throw new Error(`Failed to fetch leads for booking report: ${response.statusText}`);
        }
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching leads for BookingReportChart:", err);
        setError((err as Error).message);
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeadsData();
  }, []);

  const chartData: BookingReportData[] = useMemo(() => {
    const monthlyBookings: { [monthYear: string]: number } = {};
    const today = new Date();

    // Initialize last 7 months
    for (let i = 6; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthYearKey = format(date, 'yyyy-MM');
      monthlyBookings[monthYearKey] = 0;
    }
    
    leads.forEach(lead => {
        // We can use lead.month directly as it's in 'YYYY-MM' format
        const leadMonthYear = lead.month; 
        if (monthlyBookings.hasOwnProperty(leadMonthYear)) {
             // Count all leads for the month, or only "Closed Won" if preferred.
             // For this example, counting all leads to show activity.
            monthlyBookings[leadMonthYear]++;
        }
    });

    return Object.entries(monthlyBookings)
      .map(([monthYear, bookings]) => ({
        month: format(new Date(monthYear + '-01'), 'MMM yyyy'), // Format for display e.g. Jan 2024
        bookings,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()); // Ensure correct order

  }, [leads]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking Reports</CardTitle>
          <CardDescription>Monthly booking trends for the last 7 months.</CardDescription>
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
                <CardDescription>Monthly booking trends for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-destructive">Error loading booking report data: {error}</p>
            </CardContent>
        </Card>
    );
  }
  
  if (chartData.length === 0 && !isLoading) { // Check isLoading to avoid showing "No data" during load
    return (
        <Card>
            <CardHeader>
                <CardTitle>Booking Reports</CardTitle>
                <CardDescription>Monthly booking trends for the last 7 months.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No booking data available for the last 7 months.</p>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Reports</CardTitle>
        <CardDescription>Monthly booking trends for the last 7 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)} // Show only month abbreviation
            />
            <YAxis />
            <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))' }} 
                content={<ChartTooltipContent />} 
            />
            <Bar dataKey="bookings" fill="var(--color-bookings)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

