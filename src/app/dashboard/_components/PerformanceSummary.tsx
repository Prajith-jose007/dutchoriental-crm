
'use client';

import { BookOpenCheck, Banknote, FileWarning, CircleDollarSign } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { placeholderLeads, placeholderInvoices } from '@/lib/placeholder-data';
import type { Lead, Invoice } from '@/lib/types';
import { useMemo } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
}

function SummaryCard({ title, value, description, icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export function PerformanceSummary() {
  const { totalConfirmedBookings, totalConfirmedEarnings, overdueInvoicesCount, totalPendingPayments } = useMemo(() => {
    const confirmedLeads = placeholderLeads.filter(lead => lead.status === 'Closed Won');
    
    const totalBookings = confirmedLeads.length;
    const totalEarnings = confirmedLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    
    const overdueInvoices = placeholderInvoices.filter(invoice => invoice.status === 'Overdue').length;
    
    const pendingPayments = placeholderInvoices
      .filter(invoice => invoice.status === 'Pending' || invoice.status === 'Overdue')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
      
    return {
      totalConfirmedBookings: totalBookings,
      totalConfirmedEarnings: totalEarnings,
      overdueInvoicesCount: overdueInvoices,
      totalPendingPayments: pendingPayments,
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Confirmed Bookings"
        value={totalConfirmedBookings}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        description="Number of 'Closed Won' leads"
      />
      <SummaryCard
        title="Total Confirmed Earnings"
        value={`${totalConfirmedEarnings.toLocaleString()} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description="Sum of net amounts for 'Closed Won' leads"
      />
      <SummaryCard
        title="Overdue Invoices"
        value={overdueInvoicesCount}
        icon={<FileWarning className="h-5 w-5 text-muted-foreground" />}
        description="Number of invoices past due date"
      />
      <SummaryCard
        title="Pending Payments"
        value={`${totalPendingPayments.toLocaleString()} AED`}
        icon={<CircleDollarSign className="h-5 w-5 text-muted-foreground" />}
        description="Total from pending and overdue invoices"
      />
    </div>
  );
}
