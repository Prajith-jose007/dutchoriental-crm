
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
import type { Lead, Agent, BookingsByAgentData } from '@/lib/types';
import { placeholderAgents } from '@/lib/placeholder-data'; // Still used for agent names
import { Skeleton } from '@/components/ui/skeleton';


const chartConfig = {
  bookings: {
    label: 'Bookings',
    color: 'hsl(var(--chart-2))',
  },
};

export function BookingsByAgentBarChart() {
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
          throw new Error(`Failed to fetch leads for chart: ${response.statusText}`);
        }
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching leads for BookingsByAgentBarChart:", err);
        setError((err as Error).message);
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeadsData();
  }, []);

  const chartData: BookingsByAgentData[] = useMemo(() => {
    const bookingsByAgentMap = new Map<string, number>();
    leads.forEach(lead => {
      if (lead.status === 'Closed Won') { 
        const currentBookings = bookingsByAgentMap.get(lead.agent) || 0;
        bookingsByAgentMap.set(lead.agent, currentBookings + 1);
      }
    });

    return Array.from(bookingsByAgentMap.entries()).map(([agentId, bookingsCount]) => {
      const agent = placeholderAgents.find(a => a.id === agentId);
      return {
        agentName: agent ? agent.name.substring(0,15) + (agent.name.length > 15 ? '...' : '') : `Agent ID: ${agentId.substring(0,6)}...`,
        bookings: bookingsCount,
      };
    }).filter(item => item.bookings > 0);
  }, [leads]);


  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bookings by Agent</CardTitle>
                <CardDescription>'Closed Won' leads by agent.</CardDescription>
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
                <CardDescription>'Closed Won' leads by agent.</CardDescription>
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
                <CardDescription>'Closed Won' leads by agent.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No booking data by agent available.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings by Agent</CardTitle>
        <CardDescription>'Closed Won' leads by agent.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart 
            accessibilityLayer 
            data={chartData} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5, }}
            layout="vertical"
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="agentName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100} 
              interval={0} 
            />
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
