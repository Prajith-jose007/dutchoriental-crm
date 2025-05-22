
'use client';

import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
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
import type { Lead, Yacht, PieChartDataItem } from '@/lib/types';
import { placeholderYachts } from '@/lib/placeholder-data'; // Still used for yacht names
import { Skeleton } from '@/components/ui/skeleton';

const chartConfigBase = {
  value: {
    label: 'Revenue',
  },
};

export function SalesByYachtPieChart() {
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
        console.error("Error fetching leads for SalesByYachtPieChart:", err);
        setError((err as Error).message);
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeadsData();
  }, []);

  const chartData: PieChartDataItem[] = useMemo(() => {
    const salesByYachtMap = new Map<string, number>();
    leads.forEach(lead => {
      if (lead.status === 'Closed Won') {
        const currentSales = salesByYachtMap.get(lead.yacht) || 0;
        salesByYachtMap.set(lead.yacht, currentSales + (lead.netAmount || 0));
      }
    });

    return Array.from(salesByYachtMap.entries()).map(([yachtId, totalRevenue], index) => {
      const yacht = placeholderYachts.find(y => y.id === yachtId);
      return {
        name: yacht ? yacht.name : `Yacht ID: ${yachtId.substring(0,6)}...`,
        value: totalRevenue,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    }).filter(item => item.value > 0);
  }, [leads]);
  
  const dynamicChartConfig = useMemo(() => 
    chartData.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { label: item.name, color: item.fill };
      }
      return acc;
    }, { ...chartConfigBase })
  , [chartData]);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Revenue by Yacht</CardTitle>
          <CardDescription>Breakdown of 'Closed Won' lead revenue by yacht (Net Amount in AED).</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-48 w-48 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Revenue by Yacht</CardTitle>
                <CardDescription>Breakdown of 'Closed Won' lead revenue by yacht (Net Amount in AED).</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-destructive">Error loading sales data: {error}</p>
            </CardContent>
        </Card>
    );
  }

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Revenue by Yacht</CardTitle>
                <CardDescription>Breakdown of 'Closed Won' lead revenue by yacht (Net Amount in AED).</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No sales data available to display.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Revenue by Yacht</CardTitle>
        <CardDescription>Breakdown of 'Closed Won' lead revenue by yacht (Net Amount in AED).</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full flex items-center justify-center">
        <ChartContainer config={dynamicChartConfig} className="aspect-square h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))' }} 
                content={<ChartTooltipContent 
                            hideLabel 
                            formatter={(value, name, props) => [`${Number(value).toLocaleString()} AED`, props.payload?.name || name]}
                         />} 
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.6; 
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const displayName = name.length > 15 ? name.substring(0, 12) + '...' : name;
                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10px">
                      {`${displayName} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
