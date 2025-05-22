
'use client';

import { useEffect, useState } from 'react';
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

export function LatestInvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/invoices');
        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.statusText}`);
        }
        const data = await response.json();
        // Display latest 5, assuming the API returns them sorted or we sort here.
        // The API mock now sorts by createdAt descending.
        setInvoices(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) {
        console.error("Error fetching invoices for LatestInvoicesTable:", err);
        setError((err as Error).message);
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const getStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'outline';
    }
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
  
  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Invoices</CardTitle>
          <CardDescription>A summary of your most recent invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No invoices found.</p>
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
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id.toUpperCase()}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{invoice.amount.toLocaleString()} AED</TableCell>
                <TableCell>{new Date(invoice.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>{invoice.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
