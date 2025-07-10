
'use client';

import { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend } from 'recharts';
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
import { Skeleton } from '@/components/ui/skeleton';

const chartConfigBase = {
  value: {
    label: 'Revenue',
  },
};

interface SalesByYachtPieChartProps {
  leads: Lead[];
  allYachts: Yacht[]; 
  isLoading?: boolean;
  error?: string | null;
}

export function SalesByYachtPieChart({ leads, allYachts, isLoading, error }: SalesByYachtPieChartProps) {
  const chartData: PieChartDataItem[] = useMemo(() => {
    const salesByYachtMap = new Map<string, number>();
    leads.forEach(lead => {
      // Sales revenue is now calculated from 'Confirmed' leads only
      if (lead.status === 'Confirmed' && typeof lead.netAmount === 'number') {
        const currentSales = salesByYachtMap.get(lead.yacht) || 0;
        salesByYachtMap.set(lead.yacht, currentSales + lead.netAmount);
      }
    });

    return Array.from(salesByYachtMap.entries()).map(([yachtId, totalRevenue], index) => {
      const yacht = allYachts.find(y => y.id === yachtId);
      return {
        name: yacht ? yacht.name : `Yacht ID: ${yachtId.substring(0,6)}...`,
        value: totalRevenue,
        fill: `hsl(var(--chart-${(index % 5) + 1}))`, 
      };
    }).filter(item => item.value > 0)
      .sort((a,b) => b.value - a.value);
  }, [leads, allYachts]);
  
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
          <CardDescription>Breakdown of 'Confirmed' booking revenue by yacht (Net Amount in AED).</CardDescription>
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
                <CardDescription>Breakdown of 'Confirmed' booking revenue by yacht (Net Amount in AED).</CardDescription>
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
                <CardDescription>Breakdown of 'Confirmed' booking revenue by yacht (Net Amount in AED).</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No 'Confirmed' sales data for selected filters.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Revenue by Yacht</CardTitle>
        <CardDescription>Breakdown of 'Confirmed' booking revenue by yacht (Net Amount in AED).</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full flex items-center justify-center">
        <ChartContainer config={dynamicChartConfig} className="aspect-square h-full">
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
                  if (percent < 0.05) return null;
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
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
