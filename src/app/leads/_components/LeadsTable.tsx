'use client';

import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Lead } from '@/lib/types';
import { placeholderLeads } from '@/lib/placeholder-data';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const leadColumns: { accessorKey: keyof Lead | 'actions' | 'select', header: string }[] = [
  { accessorKey: 'select', header: '' },
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'agent', header: 'Agent' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'yacht', header: 'Yacht' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'invoiceId', header: 'Invoice' },
  { accessorKey: 'packageType', header: 'Package' },
  { accessorKey: 'clientName', header: 'Client' },
  { accessorKey: 'free', header: 'Free' },
  { accessorKey: 'dhowChild89', header: 'Dhow Child 89' },
  { accessorKey: 'dhowFood99', header: 'Dhow Food 99' },
  { accessorKey: 'dhowDrinks199', header: 'Dhow Drinks 199' },
  { accessorKey: 'dhowVip299', header: 'Dhow VIP 299' },
  { accessorKey: 'oeChild129', header: 'OE Child 129' },
  { accessorKey: 'oeFood149', header: 'OE Food 149' },
  { accessorKey: 'oeDrinks249', header: 'OE Drinks 249' },
  { accessorKey: 'oeVip349', header: 'OE VIP 349' },
  { accessorKey: 'sunsetChild179', header: 'Sunset Child 179' },
  { accessorKey: 'sunsetFood199', header: 'Sunset Food 199' },
  { accessorKey: 'sunsetDrinks299', header: 'Sunset Drinks 299' },
  { accessorKey: 'lotusFood249', header: 'Lotus Food 249' },
  { accessorKey: 'lotusDrinks349', header: 'Lotus Drinks 349' },
  { accessorKey: 'lotusVip399', header: 'Lotus VIP 399' },
  { accessorKey: 'lotusVip499', header: 'Lotus VIP 499' },
  { accessorKey: 'othersAmtCake', header: 'Others (Cake)' },
  { accessorKey: 'quantity', header: 'Qty' },
  { accessorKey: 'rate', header: 'Rate' },
  { accessorKey: 'totalAmount', header: 'Amt' },
  { accessorKey: 'commissionPercentage', header: 'Comm %' },
  { accessorKey: 'netAmount', header: 'Net' },
  { accessorKey: 'paidAmount', header: 'Paid' },
  { accessorKey: 'balanceAmount', header: 'Balance' },
  { accessorKey: 'actions', header: 'Actions' },
];


export function LeadsTable() {
  const leads: Lead[] = placeholderLeads;

  const getStatusVariant = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'outline';
      case 'Contacted': return 'secondary';
      case 'Qualified': return 'default'; // Using primary for qualified
      case 'Proposal Sent': return 'default'; // Using a variant of primary or accent
      case 'Closed Won': return 'default'; // Greenish, shadcn 'default' can be primary
      case 'Closed Lost': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <ScrollArea className="rounded-md border whitespace-nowrap">
      <Table>
        <TableHeader>
          <TableRow>
            {leadColumns.map(col => (
              <TableHead key={col.accessorKey} className={col.accessorKey === 'select' ? "w-[40px]" : ""}>
                {col.accessorKey === 'select' ? (
                  <Checkbox aria-label="Select all rows" />
                ) : col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={leadColumns.length} className="h-24 text-center">
                No leads found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox aria-label={`Select row ${lead.id}`} />
                </TableCell>
                {leadColumns.slice(1, -1).map(col => (
                  <TableCell key={col.accessorKey}>
                    {col.accessorKey === 'status' ? (
                      <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                    ) : col.accessorKey === 'free' ? (
                      lead.free ? 'Yes' : 'No'
                    ) : (
                      lead[col.accessorKey as keyof Lead] !== undefined && lead[col.accessorKey as keyof Lead] !== null ? 
                      String(lead[col.accessorKey as keyof Lead]) : '-'
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => console.log('View lead', lead.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('Edit lead', lead.id)}>
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
