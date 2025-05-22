
'use client';

import { useEffect, useState, useMemo } from 'react';
import { BookOpenCheck, Banknote, FileWarning, CircleDollarSign } from 'lucide-react';
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

export function PerformanceSummary() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [errorLeads, setErrorLeads] = useState<string | null>(null);
  const [errorInvoices, setErrorInvoices] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadsData = async () => {
      setIsLoadingLeads(true);
      setErrorLeads(null);
      try {
        const response = await fetch('/api/leads');
        if (!response.ok) {
          throw new Error(`Failed to fetch leads: ${response.statusText}`);
        }
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching leads for dashboard:", err);
        setErrorLeads((err as Error).message);
        setLeads([]);
      } finally {
        setIsLoadingLeads(false);
      }
    };

    const fetchInvoicesData = async () => {
      setIsLoadingInvoices(true);
      setErrorInvoices(null);
      try {
        const response = await fetch('/api/invoices');
        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.statusText}`);
        }
        const data = await response.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching invoices for dashboard:", err);
        setErrorInvoices((err as Error).message);
        setInvoices([]);
      } finally {
        setIsLoadingInvoices(false);
      }
    };

    fetchLeadsData();
    fetchInvoicesData();
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

  const { overdueInvoicesCount, totalPendingPayments } = useMemo(() => {
    const overdue = invoices.filter(invoice => invoice.status === 'Overdue').length;
    const pending = invoices
      .filter(invoice => invoice.status === 'Pending' || invoice.status === 'Overdue')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    return {
      overdueInvoicesCount: overdue,
      totalPendingPayments: pending,
    };
  }, [invoices]);

  const isLoading = isLoadingLeads || isLoadingInvoices;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Confirmed Bookings"
        value={errorLeads ? 'Error' : totalConfirmedBookings}
        icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
        description={errorLeads ? errorLeads : "Number of 'Closed Won' leads"}
        isLoading={isLoadingLeads}
      />
      <SummaryCard
        title="Total Confirmed Earnings"
        value={errorLeads ? 'Error' : `${totalConfirmedEarnings.toLocaleString()} AED`}
        icon={<Banknote className="h-5 w-5 text-muted-foreground" />}
        description={errorLeads ? errorLeads : "Sum of net amounts for 'Closed Won' leads"}
        isLoading={isLoadingLeads}
      />
      <SummaryCard
        title="Overdue Invoices"
        value={errorInvoices ? 'Error' : overdueInvoicesCount}
        icon={<FileWarning className="h-5 w-5 text-muted-foreground" />}
        description={errorInvoices ? errorInvoices : "Number of invoices past due date"}
        isLoading={isLoadingInvoices}
      />
      <SummaryCard
        title="Pending Payments"
        value={errorInvoices ? 'Error' : `${totalPendingPayments.toLocaleString()} AED`}
        icon={<CircleDollarSign className="h-5 w-5 text-muted-foreground" />}
        description={errorInvoices ? errorInvoices : "Total from pending and overdue invoices"}
        isLoading={isLoadingInvoices}
      />
    </div>
  );
}
