
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
import type { Lead, Yacht, User } from '@/lib/types';
import { placeholderYachts, placeholderUsers } from '@/lib/placeholder-data';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Find yacht name from ID
const getYachtName = (yachtId: string): string => {
  const yacht = placeholderYachts.find(y => y.id === yachtId);
  return yacht ? yacht.name : yachtId;
};

// Find agent name from ID
const getAgentName = (agentId: string): string => {
  const user = placeholderUsers.find(u => u.id === agentId);
  return user ? user.name : agentId;
}

const leadColumns: { accessorKey: keyof Lead | 'actions' | 'select', header: string, isCurrency?: boolean, isPercentage?: boolean }[] = [
  { accessorKey: 'select', header: '' },
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'agent', header: 'Agent' }, // Will display Agent Name
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'yacht', header: 'Yacht' }, // Will display Yacht Name
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'invoiceId', header: 'Invoice' },
  { accessorKey: 'packageType', header: 'Package' },
  { accessorKey: 'clientName', header: 'Client' },
  { accessorKey: 'free', header: 'Free' },
  // Quantities - these are numbers, not currency
  { accessorKey: 'dhowChild89', header: 'Dhow Child Qty' },
  { accessorKey: 'dhowFood99', header: 'Dhow Food Qty' },
  // ... (add all other quantity fields here if needed in table, or keep table concise)
  { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
  { accessorKey: 'commissionPercentage', header: 'Comm %', isPercentage: true },
  { accessorKey: 'commissionAmount', header: 'Comm Amt', isCurrency: true },
  { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
  { accessorKey: 'paidAmount', header: 'Paid Amt', isCurrency: true },
  { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true },
  { accessorKey: 'actions', header: 'Actions' },
];


interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
}

export function LeadsTable({ leads, onEditLead }: LeadsTableProps) {

  const getStatusVariant = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'outline';
      case 'Contacted': return 'secondary';
      case 'Qualified': return 'default'; 
      case 'Proposal Sent': return 'default'; 
      case 'Closed Won': return 'default'; // Successful status often uses primary/default
      case 'Closed Lost': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number') return '-';
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
  };
  
  const formatPercentage = (value: number | undefined | null) => {
    if (typeof value !== 'number') return '-';
    return `${value.toFixed(1)}%`;
  }

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
                    {col.accessorKey === 'id' ? (
                       <Button variant="link" className="p-0 h-auto font-medium" onClick={() => onEditLead(lead)}>
                        {/* Shorten ID for display if too long, or show full */}
                        {lead.id.length > 10 ? lead.id.substring(0,4) + '...' + lead.id.substring(lead.id.length-4) : lead.id}
                       </Button>
                    ) : col.accessorKey === 'agent' ? (
                        getAgentName(lead.agent)
                    ) : col.accessorKey === 'yacht' ? (
                        getYachtName(lead.yacht)
                    ): col.accessorKey === 'status' ? (
                      <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                    ) : col.accessorKey === 'free' ? (
                      lead.free ? <Badge variant="secondary">Yes</Badge> : 'No'
                    ) : col.isCurrency ? (
                      formatCurrency(lead[col.accessorKey as keyof Lead] as number | undefined)
                    ) : col.isPercentage ? (
                        formatPercentage(lead[col.accessorKey as keyof Lead] as number | undefined)
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
                      <DropdownMenuItem onClick={() => onEditLead(lead)}>
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('View lead details', lead.id)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive" 
                        onClick={() => console.warn('Delete lead action (not implemented)', lead.id)}
                      >
                        Delete Lead
                      </DropdownMenuItem>
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
