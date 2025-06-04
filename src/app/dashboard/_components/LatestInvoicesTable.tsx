
'use client';

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Invoice, Lead } from '@/lib/types'; // Added Lead
import { Skeleton } from '@/components/ui/skeleton';

interface LatestInvoicesTableProps {
  invoices: Invoice[];
  leads: Lead[]; // Added leads prop
  isLoading?: boolean;
  error?: string | null;
}

export function LatestInvoicesTable({ invoices, leads, isLoading, error }: LatestInvoicesTableProps) {
  const latestFiveInvoices = useMemo(() => {
    const closedLeadIds = new Set(
      leads.filter(lead => lead.status === 'Closed').map(lead => lead.id)
    );

    const closedLeadInvoices = invoices.filter(invoice => closedLeadIds.has(invoice.leadId));
    
    // Sort by createdAt (most recent first) and then take top 5
    return closedLeadInvoices
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [invoices, leads]);

  const getStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Overdue': return 'secondary'; // Treat Overdue as Pending for badge variant
      default: return 'outline';
    }
  };

  const getDisplayStatusText = (status: Invoice['status']) => {
    if (status === 'Overdue') return 'Pending';
    return status;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Invoices (Closed Leads)</CardTitle>
          <CardDescription>A summary of your most recent invoices from closed leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Invoices (Closed Leads)</CardTitle>
          <CardDescription>A summary of your most recent invoices from closed leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading invoices: {error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (latestFiveInvoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Invoices (Closed Leads)</CardTitle>
          <CardDescription>A summary of your most recent invoices from closed leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No invoices found for 'Closed' leads matching the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Invoices (Closed Leads)</CardTitle>
        <CardDescription>A summary of your most recent invoices from closed leads.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestFiveInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id.toUpperCase()}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{invoice.amount.toLocaleString()} AED</TableCell>
                <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>{getDisplayStatusText(invoice.status)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
