
'use client';

import { useMemo } from 'react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Opportunity, OpportunityPipelinePhase } from '@/lib/types';
import { opportunityPipelinePhaseOptions } from '@/lib/types';
import { ChartTooltipContent, ChartContainer } from '@/components/ui/chart';

interface OpportunityFunnelChartProps {
  opportunities: Opportunity[];
  isLoading?: boolean;
  error?: string | null;
}

const FUNNEL_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))', // Repeat for more stages
];

export function OpportunityFunnelChart({ opportunities, isLoading, error }: OpportunityFunnelChartProps) {
  const {chartData, chartConfig} = useMemo(() => {
    const stageOrder = [...opportunityPipelinePhaseOptions].reverse(); // Funnel typically shows wide to narrow
    
    const stageCounts: { [key in OpportunityPipelinePhase]?: number } = {};
    stageOrder.forEach(stage => stageCounts[stage] = 0);

    opportunities.forEach(opp => {
      if (stageCounts.hasOwnProperty(opp.pipelinePhase)) {
        stageCounts[opp.pipelinePhase]!++;
      }
    });

    const data = stageOrder.map((stage, index) => ({
      value: stageCounts[stage] || 0,
      name: stage,
      fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
    })).filter(item => item.value > 0); // Only show stages with opportunities

    const config = data.reduce((acc, item) => {
      acc[item.name] = { label: item.name, color: item.fill };
      return acc;
    }, {} as any);


    return {chartData: data, chartConfig: config};

  }, [opportunities]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Funnel</CardTitle>
          <CardDescription>Opportunity distribution by pipeline phase.</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Funnel</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-destructive">Error loading funnel data: {error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Funnel</CardTitle>
          <CardDescription>Opportunity distribution by pipeline phase.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">No opportunity data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Funnel</CardTitle>
        <CardDescription>Opportunity distribution by pipeline phase.</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={<ChartTooltipContent />}
              />
              <Funnel dataKey="value" data={chartData} isAnimationActive>
                <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
