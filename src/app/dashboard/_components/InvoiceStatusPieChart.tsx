
'use client';

import { useMemo } from 'react';
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
import type { Invoice, PieChartDataItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfigBase = {
  value: { label: 'Invoices' },
  Paid: { label: 'Paid', color: 'hsl(var(--chart-1))' },
  Pending: { label: 'Pending', color: 'hsl(var(--chart-2))' },
  // Overdue entry removed
};

interface InvoiceStatusPieChartProps {
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
}

export function InvoiceStatusPieChart({ invoices, isLoading, error }: InvoiceStatusPieChartProps) {
  const chartData: PieChartDataItem[] = useMemo(() => {
    const statusCounts: { Paid: number; Pending: number } = {
      Paid: 0,
      Pending: 0,
    };
    invoices.forEach(invoice => {
      if (invoice.status === 'Paid') {
        statusCounts.Paid++;
      } else { // Group 'Pending' and 'Overdue' into 'Pending'
        statusCounts.Pending++;
      }
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      fill: chartConfigBase[name as keyof typeof chartConfigBase]?.color || 'hsl(var(--chart-5))',
    })).filter(item => item.value > 0);
  }, [invoices]);

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
          <CardTitle>Invoice Status Report</CardTitle>
          <CardDescription>Breakdown of invoices by status.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
           <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-48 w-48 rounded-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Report</CardTitle>
          <CardDescription>Breakdown of invoices by status.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-destructive">Error loading invoice data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status Report</CardTitle>
          <CardDescription>Breakdown of invoices by status.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No invoice data available for selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice Status Report</CardTitle>
        <CardDescription>Breakdown of invoices by status.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full flex items-center justify-center">
        <ChartContainer config={dynamicChartConfig} className="aspect-square h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))' }} 
                content={<ChartTooltipContent hideLabel />} 
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
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  if (percent < 0.05) return null;
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
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
