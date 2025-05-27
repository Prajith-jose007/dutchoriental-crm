
'use client';

import { useMemo, useState, useEffect } from 'react';
import { BookOpenCheck, Banknote, CircleDollarSign, AlertTriangle } from 'lucide-react'; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Lead, Invoice } from '@/lib/types';
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
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
}

export function PerformanceSummary({ leads, invoices, isLoading, error }: PerformanceSummaryProps) {
  const { totalConfirmedBookings, totalConfirmedEarnings } = useMemo(() => {
    const confirmedLeads = leads.filter(lead => lead.status === 'Conformed');
    const totalBookings = confirmedLeads.length;
    const totalEarnings = confirmedLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    return {
      totalConfirmedBookings: totalBookings,
      totalConfirmedEarnings: totalEarnings,
    };
  }, [leads]);

  const { totalPendingPayments } = useMemo(() => {
    const pending = invoices
      .filter(invoice => invoice.status === 'Pending' || invoice.status === 'Overdue')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    return {
      totalPendingPayments: pending,
    };
  }, [invoices]);

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
      <SummaryCard
        title="Total Confirmed Bookings"
        value={error ? 'Error' : totalConfirmedBookings}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        description={error ? error : "Number of 'Conformed' leads"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Total Confirmed Earnings"
        value={error ? 'Error' : `${totalConfirmedEarnings.toLocaleString()} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description={error ? error : "Sum of net amounts for 'Conformed' leads"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Pending Payments"
        value={error ? 'Error' : `${totalPendingPayments.toLocaleString()} AED`}
        icon={<CircleDollarSign className="h-5 w-5 text-muted-foreground" />}
        description={error ? error : "Total from pending and overdue invoices"}
        isLoading={isLoading}
      />
    </div>
  );
}
