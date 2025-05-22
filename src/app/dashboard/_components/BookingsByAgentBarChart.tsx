
'use client';

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
import type { BookingsByAgentData } from '@/lib/types';
import { placeholderBookingsByAgent } from '@/lib/placeholder-data';

const chartConfig = {
  bookings: {
    label: 'Bookings',
    color: 'hsl(var(--chart-2))', // Using a different chart color
  },
};

export function BookingsByAgentBarChart() {
  const data: BookingsByAgentData[] = placeholderBookingsByAgent;

  if (data.length === 0) {
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
            data={data} 
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            layout="vertical" // Switched to vertical bar chart for better label readability
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis
              dataKey="agentName"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100} // Adjust width for agent names
              interval={0} // Ensure all agent names are shown
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
