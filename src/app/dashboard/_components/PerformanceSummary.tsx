'use client';

import { useMemo } from 'react';
import { Users, Banknote, Ticket } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function SummaryCard({ title, value, description, icon, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface PerformanceSummaryProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: string | null;
}

export function PerformanceSummary({ leads, isLoading, error }: PerformanceSummaryProps) {
  const summaryData = useMemo(() => {
    const totalPassengers = leads.reduce((acc, lead) => {
      const passengersInLead = lead.packageQuantities?.reduce((sum, pkg) => sum + (pkg.quantity || 0), 0) || 0;
      return acc + passengersInLead;
    }, 0);

    const totalRevenue = leads.reduce((acc, lead) => acc + (lead.netAmount || 0), 0);

    const averageTicketPrice = totalPassengers > 0 ? totalRevenue / totalPassengers : 0;

    return {
      totalPassengers,
      totalRevenue,
      averageTicketPrice,
    };
  }, [leads]);


  const leadsError = error && leads.length === 0 ? error : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SummaryCard
        title="Total Passengers"
        value={leadsError ? 'Error' : summaryData.totalPassengers.toLocaleString()}
        icon={<Users className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Total passengers from all bookings"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Total Revenue"
        value={leadsError ? 'Error' : `${summaryData.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Sum of net amounts from all bookings"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Average Ticket Price"
        value={leadsError ? 'Error' : `${summaryData.averageTicketPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`}
        icon={<Ticket className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Total revenue / Total passengers"}
        isLoading={isLoading}
      />
    </div>
  );
}
