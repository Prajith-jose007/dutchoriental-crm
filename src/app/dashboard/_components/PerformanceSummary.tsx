
'use client';

import { useMemo } from 'react';
import { BookOpenCheck, Banknote, CircleDollarSign, Wallet, BookOpen, Activity } from 'lucide-react'; // Added Activity
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
  const { totalSuccessfulBookings, totalSuccessfulEarnings, totalBalanceFromActiveLeads, totalBookingsCount, totalActiveLeads } = useMemo(() => {
    const successfulLeads = leads.filter(lead => lead.status === 'Closed');
    const activeLeads = leads.filter(lead => lead.status === 'Active'); // Changed from 'Balance'

    const bookingsCount = leads.length;
    const closedBookings = successfulLeads.length;
    const earnings = successfulLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    // Calculate balance amount from 'Active' leads
    const balanceAmount = activeLeads.reduce((sum, lead) => sum + Math.abs(lead.balanceAmount || 0), 0);
    const activeLeadsCount = activeLeads.length;

    return {
      totalBookingsCount: bookingsCount,
      totalSuccessfulBookings: closedBookings,
      totalSuccessfulEarnings: earnings,
      totalBalanceFromActiveLeads: balanceAmount, // Renamed for clarity
      totalActiveLeads: activeLeadsCount,
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

  const leadsError = error && leads.length === 0 ? error : null;
  const invoicesError = error && invoices.length === 0 ? error : null;


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"> {/* Adjusted to 5 columns */}
      <SummaryCard
        title="Total Leads"
        value={leadsError ? 'Error' : totalBookingsCount}
        icon={<BookOpen className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Total number of all leads"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Active Leads"
        value={leadsError ? 'Error' : totalActiveLeads}
        icon={<Activity className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Number of 'Active' leads"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Closed Leads"
        value={leadsError ? 'Error' : totalSuccessfulBookings}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Number of 'Closed' leads"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Revenue (Closed Leads)"
        value={leadsError ? 'Error' : `${totalSuccessfulEarnings.toLocaleString()} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Sum of net amounts for 'Closed' leads"}
        isLoading={isLoading}
      />
      <SummaryCard
        title="Balance (Active Leads)"
        value={leadsError ? 'Error' : `${totalBalanceFromActiveLeads.toLocaleString()} AED`}
        icon={<Wallet className="h-5 w-5 text-muted-foreground" />}
        description={leadsError ? leadsError : "Sum of balance for 'Active' status leads"}
        isLoading={isLoading}
      />
      {/* This one can be added if a 5th distinct summary is needed or adjust grid cols */}
      {/* <SummaryCard
        title="Pending Payments (Invoices)"
        value={invoicesError ? 'Error' : `${totalPendingPayments.toLocaleString()} AED`}
        icon={<CircleDollarSign className="h-5 w-5 text-muted-foreground" />}
        description={invoicesError ? invoicesError : "Total from pending and overdue invoices"}
        isLoading={isLoading}
      /> */}
    </div>
  );
}
