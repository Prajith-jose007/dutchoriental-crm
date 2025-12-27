
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts'; // Added Cell
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
import type { Lead, Agent, BookingsByAgentData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  bookings: {
    label: 'Bookings',
    // Base color, will be overridden by Cells but useful for tooltip/legend consistency if needed
    color: 'hsl(var(--chart-2))',
  },
};

// Define a list of colors to cycle through for the bars
const BAR_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  // Add more if you have more chart colors defined in globals.css
  // e.g., 'hsl(var(--chart-6))', 'hsl(var(--chart-7))', etc.
];


interface BookingsByAgentBarChartProps {
  leads: Lead[];
  allAgents: Agent[];
  isLoading?: boolean;
  error?: string | null;
}

export function BookingsByAgentBarChart({ leads, allAgents, isLoading, error }: BookingsByAgentBarChartProps) {
  const chartData: BookingsByAgentData[] = useMemo(() => {
    const bookingsByAgentMap = new Map<string, number>();
    leads.forEach(lead => {
      if (lead.status.startsWith('Closed')) {
        const currentBookings = bookingsByAgentMap.get(lead.agent) || 0;
        bookingsByAgentMap.set(lead.agent, currentBookings + 1);
      }
    });

    return Array.from(bookingsByAgentMap.entries()).map(([agentId, bookingsCount]) => {
      const agent = allAgents.find(a => a.id === agentId);
      return {
        agentName: agent ? agent.name.substring(0, 15) + (agent.name.length > 15 ? '...' : '') : `Agent ID: ${agentId.substring(0, 6)}...`,
        bookings: bookingsCount,
      };
    }).filter(item => item.bookings > 0)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10);
  }, [leads, allAgents]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Agent</CardTitle>
          <CardDescription>&apos;Closed&apos; bookings by agent (Top 10).</CardDescription>
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
          <CardTitle>Bookings by Agent</CardTitle>
          <CardDescription>&apos;Closed&apos; bookings by agent (Top 10).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-destructive">Error loading booking data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Agent</CardTitle>
          <CardDescription>&apos;Closed&apos; bookings by agent (Top 10).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No &apos;Closed&apos; booking data by agent for selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings by Agent</CardTitle>
        <CardDescription>&apos;Closed&apos; bookings by agent (Top 10).</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5, }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="agentName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              minTickGap={-5}
              height={60}
            />
            <YAxis
              type="number"
              allowDecimals={false}
            />
            <RechartsTooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent />}
            />
            <Bar dataKey="bookings" radius={4}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${entry.agentName}-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
