
'use client';

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
import type { PieChartDataItem } from '@/lib/types';
import { placeholderInvoiceStatusData } from '@/lib/placeholder-data';

const chartConfig = {
  value: { // A generic key for the data, actual keys are in PieChartDataItem.name
    label: 'Invoices',
  },
  Paid: { label: 'Paid', color: 'hsl(var(--chart-1))' },
  Pending: { label: 'Pending', color: 'hsl(var(--chart-2))' },
  Overdue: { label: 'Overdue', color: 'hsl(var(--chart-3))' },
};

export function InvoiceStatusPieChart() {
  const data: PieChartDataItem[] = placeholderInvoiceStatusData;

  if (data.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoice Status Report</CardTitle>
                <CardDescription>Breakdown of invoices by status.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No invoice data available to display.</p>
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
        <ChartContainer config={chartConfig} className="aspect-square h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <RechartsTooltip 
                cursor={{ fill: 'hsl(var(--muted))' }} 
                content={<ChartTooltipContent hideLabel />} 
              />
              <Pie
                data={data}
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
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                      {`${name} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}
              >
                {data.map((entry, index) => (
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
