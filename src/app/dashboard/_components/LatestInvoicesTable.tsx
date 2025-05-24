
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
import type { Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

interface LatestInvoicesTableProps {
  invoices: Invoice[];
  isLoading?: boolean;
  error?: string | null;
}

export function LatestInvoicesTable({ invoices, isLoading, error }: LatestInvoicesTableProps) {
  const latestFiveInvoices = useMemo(() => {
    return invoices.slice(0, 5);
  }, [invoices]);

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
          <CardTitle>Latest Invoices</CardTitle>
          <CardDescription>A summary of your most recent invoices.</CardDescription>
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
          <CardTitle>Latest Invoices</CardTitle>
          <CardDescription>A summary of your most recent invoices.</CardDescription>
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
          <CardTitle>Latest Invoices</CardTitle>
          <CardDescription>A summary of your most recent invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No invoices found for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Invoices</CardTitle>
        <CardDescription>A summary of your most recent invoices.</CardDescription>
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
