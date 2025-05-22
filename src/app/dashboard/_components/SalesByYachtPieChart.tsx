
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
import { placeholderSalesByYacht } from '@/lib/placeholder-data';

const chartConfig = {
  value: { // Generic key, specific names are in data
    label: 'Revenue', // Will be shown in tooltip if not overridden by data item name
  },
  // Dynamic keys based on yacht names will be used from placeholderSalesByYacht
  // Example: 'The Sea Serpent': { label: 'The Sea Serpent', color: 'hsl(var(--chart-1))' },
};

export function SalesByYachtPieChart() {
  const data: PieChartDataItem[] = placeholderSalesByYacht;

  // Dynamically build chartConfig for labels if not already present from data.fill
  const dynamicChartConfig = data.reduce((acc, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { label: item.name, color: item.fill };
    }
    return acc;
  }, { ...chartConfig });


  if (data.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sales Revenue by Yacht</CardTitle>
                <CardDescription>Breakdown of 'Closed Won' lead revenue by yacht.</CardDescription>
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
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                  const RADIAN = Math.PI / 180;
                  // Adjusted radius for label positioning
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.6; 
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  // Shorten name if too long
                  const displayName = name.length > 15 ? name.substring(0, 12) + '...' : name;
                  return (
                    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="10px">
                      {`${displayName} (${(percent * 100).toFixed(0)}%)`}
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
