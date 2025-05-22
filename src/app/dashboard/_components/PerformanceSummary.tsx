
'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookOpenCheck, Banknote, FileWarning, CircleDollarSign } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { placeholderInvoices } from '@/lib/placeholder-data'; // Still used for invoice data
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

export function PerformanceSummary() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadsData = async () => {
      setIsLoadingLeads(true);
      setError(null);
      try {
        const response = await fetch('/api/leads');
        if (!response.ok) {
          throw new Error(`Failed to fetch leads: ${response.statusText}`);
        }
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching leads for dashboard:", err);
        setError((err as Error).message);
        setLeads([]); // Fallback to empty or could use placeholderLeads as a fallback
      } finally {
        setIsLoadingLeads(false);
      }
    };
    fetchLeadsData();
  }, []);

  const { totalConfirmedBookings, totalConfirmedEarnings } = useMemo(() => {
    const confirmedLeads = leads.filter(lead => lead.status === 'Closed Won');
    const totalBookings = confirmedLeads.length;
    const totalEarnings = confirmedLeads.reduce((sum, lead) => sum + (lead.netAmount || 0), 0);
    return {
      totalConfirmedBookings: totalBookings,
      totalConfirmedEarnings: totalEarnings,
    };
  }, [leads]);

  // Invoice data still comes from placeholders
  const { overdueInvoicesCount, totalPendingPayments } = useMemo(() => {
    const overdueInvoices = placeholderInvoices.filter(invoice => invoice.status === 'Overdue').length;
    const pendingPayments = placeholderInvoices
      .filter(invoice => invoice.status === 'Pending' || invoice.status === 'Overdue')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    return {
      overdueInvoicesCount: overdueInvoices,
      totalPendingPayments: pendingPayments,
    };
  }, []);

  if (error && isLoadingLeads) { // Show error only if loading failed, not if it's just loading
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="pt-6"><p className="text-destructive">Error loading leads data.</p></CardContent></Card>
            <Card><CardContent className="pt-6"><p className="text-destructive">Error loading leads data.</p></CardContent></Card>
             {/* Static invoice cards can still render */}
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


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Confirmed Bookings"
        value={totalConfirmedBookings}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        description="Number of 'Closed Won' leads"
        isLoading={isLoadingLeads}
      />
      <SummaryCard
        title="Total Confirmed Earnings"
        value={`${totalConfirmedEarnings.toLocaleString()} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description="Sum of net amounts for 'Closed Won' leads"
        isLoading={isLoadingLeads}
      />
      {/* Invoice related cards remain, using placeholder data */}
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
