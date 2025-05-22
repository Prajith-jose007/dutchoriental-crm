import { DollarSign, TrendingUp, CalendarDays } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { placeholderRevenueData } from '@/lib/placeholder-data';
import type { RevenueData } from '@/lib/types';

export function RevenueSummary() {
  const revenueData: RevenueData[] = placeholderRevenueData;

  const getIcon = (period: string) => {
    if (period === 'Today') return <DollarSign className="h-5 w-5 text-muted-foreground" />;
    if (period === 'This Month') return <CalendarDays className="h-5 w-5 text-muted-foreground" />;
    return <TrendingUp className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {revenueData.map((item) => (
        <Card key={item.period}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.period} Revenue
            </CardTitle>
            {getIcon(item.period)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.amount.toLocaleString()} AED
            </div>
            <p className="text-xs text-muted-foreground">
              Compared to last period
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
