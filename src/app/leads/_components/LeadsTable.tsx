
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
import type { Lead, LeadStatus } from '@/lib/types';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, parseISO, isValid } from 'date-fns';

type LeadTableColumn = {
  accessorKey: keyof Lead | 'actions' | 'select' | 'totalGuests';
  header: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
  isNumeric?: boolean;
  isDate?: boolean;
  isShortDate?: boolean;
  isNotes?: boolean;
  isUserLookup?: boolean;
  isAgentLookup?: boolean;
  isYachtLookup?: boolean;
};

const leadColumns: LeadTableColumn[] = [
  { accessorKey: 'select', header: '' },
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientName', header: 'Client' },
  { accessorKey: 'agent', header: 'Agent', isAgentLookup: true },
  { accessorKey: 'yacht', header: 'Yacht', isYachtLookup: true },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'month', header: 'Lead/Event Date', isShortDate: true },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'transactionId', header: 'Transaction ID' },
  { accessorKey: 'modeOfPayment', header: 'Payment Mode' },
  
  { accessorKey: 'totalGuests', header: 'Total Guests', isNumeric: true },

  { accessorKey: 'qty_childRate', header: 'CHILD', isNumeric: true },
  { accessorKey: 'qty_adultStandardRate', header: 'STD', isNumeric: true },
  { accessorKey: 'qty_adultStandardDrinksRate', header: 'STD DRK', isNumeric: true },
  { accessorKey: 'qty_vipChildRate', header: 'VIP CH', isNumeric: true },
  { accessorKey: 'qty_vipAdultRate', header: 'VIP', isNumeric: true },
  { accessorKey: 'qty_vipAdultDrinksRate', header: 'VIP AL', isNumeric: true },
  { accessorKey: 'qty_royalChildRate', header: 'RYL CH', isNumeric: true },
  { accessorKey: 'qty_royalAdultRate', header: 'RYL', isNumeric: true },
  { accessorKey: 'qty_royalDrinksRate', header: 'RYL DRK', isNumeric: true },
  { accessorKey: 'othersAmtCake', header: 'Custom Charge Qty', isNumeric: true },

  { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
  { accessorKey: 'commissionPercentage', header: 'Agent Disc. %', isPercentage: true },
  { accessorKey: 'commissionAmount', header: 'Comm Amt', isCurrency: true },
  { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
  { accessorKey: 'paidAmount', header: 'Paid Amt', isCurrency: true },
  { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true },
  { accessorKey: 'notes', header: 'Notes', isNotes: true },
  { accessorKey: 'lastModifiedByUserId', header: 'Modified By', isUserLookup: true },
  { accessorKey: 'ownerUserId', header: 'Lead Owner', isUserLookup: true },
  { accessorKey: 'createdAt', header: 'Created At', isDate: true },
  { accessorKey: 'updatedAt', header: 'Updated At', isDate: true },
  { accessorKey: 'actions', header: 'Actions' },
];

interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  userMap: { [id: string]: string };
  agentMap: { [id: string]: string };
  yachtMap: { [id: string]: string };
  currentUserId?: string;
}

export function LeadsTable({
  leads,
  onEditLead,
  onDeleteLead,
  userMap,
  agentMap,
  yachtMap,
  currentUserId
}: LeadsTableProps) {

  const getStatusVariant = (status?: LeadStatus) => {
    if (!status) return 'outline';
    switch (status) {
      case 'Balance': return 'secondary';
      case 'Closed': return 'outline';
      case 'Conformed': return 'default';
      case 'Upcoming': return 'secondary';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (typeof amount !== 'number' || isNaN(amount)) return '-';
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
  };

  const formatPercentage = (value?: number | null) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${value.toFixed(1)}%`;
  }

  const formatNumeric = (num?: number | null): string => {
    if (num === null || num === undefined || isNaN(num)) {
      return '-'; 
    }
    return String(num);
  };


  const formatDateValue = (dateString?: string, includeTime: boolean = true) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString; 
      const dateFormat = includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy';
      return format(date, dateFormat);
    } catch (e) {
      console.warn(`Error formatting date: ${dateString}`, e);
      return dateString; 
    }
  };

  const formatNotes = (notes?: string) => {
    if (!notes || notes.trim() === '') return '-';
    return notes.length > 30 ? notes.substring(0, 27) + '...' : notes;
  }

  const calculateTotalGuests = (lead: Lead): number => {
    let total = 0;
    total += Number(lead.qty_childRate || 0);
    total += Number(lead.qty_adultStandardRate || 0);
    total += Number(lead.qty_adultStandardDrinksRate || 0);
    total += Number(lead.qty_vipChildRate || 0);
    total += Number(lead.qty_vipAdultRate || 0);
    total += Number(lead.qty_vipAdultDrinksRate || 0);
    total += Number(lead.qty_royalChildRate || 0);
    total += Number(lead.qty_royalAdultRate || 0);
    total += Number(lead.qty_royalDrinksRate || 0);
    return total;
  };

  const renderCellContent = (lead: Lead, column: LeadTableColumn) => {
    const value = lead[column.accessorKey as keyof Lead];

    if (column.accessorKey === 'totalGuests') {
      return formatNumeric(calculateTotalGuests(lead));
    }
    if (column.accessorKey === 'id') {
      return (
        <Button variant="link" className="p-0 h-auto font-medium" onClick={() => onEditLead(lead)}>
          {String(lead.id).length > 10 ? String(lead.id).substring(0, 4) + '...' + String(lead.id).substring(String(lead.id).length - 4) : lead.id}
        </Button>
      );
    }
    if (column.accessorKey === 'status') {
      return <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>;
    }
    if (column.isAgentLookup) {
      const agentId = value as string | undefined;
      return agentId ? agentMap[agentId] || agentId : '-';
    }
    if (column.isYachtLookup) {
      const yachtId = value as string | undefined;
      return yachtId ? yachtMap[yachtId] || yachtId : '-';
    }
    if (column.isShortDate) {
      return formatDateValue(value as string | undefined, false);
    }
    if (column.isDate) {
      return formatDateValue(value as string | undefined);
    }
    if (column.isCurrency) {
      return formatCurrency(value as number | undefined);
    }
    if (column.isPercentage) {
      return formatPercentage(value as number | undefined);
    }
    if (column.isNumeric) { 
      return formatNumeric(value as number | undefined);
    }
    if (column.isNotes) {
      return formatNotes(value as string | undefined);
    }
    if (column.isUserLookup) {
      const userId = value as string | undefined;
      return userId ? userMap[userId] || userId : '-';
    }
    return value !== undefined && value !== null ? String(value) : '-';
  };

  return (
    <ScrollArea className="rounded-md border whitespace-nowrap">
      <Table>
        <TableHeader>
          <TableRow>
            {leadColumns.map(col => (
              <TableHead key={col.accessorKey} className={col.accessorKey === 'select' ? "w-[40px]" : ""}>
                {col.accessorKey === 'select' ? (
                  <Checkbox aria-label="Select all rows" disabled /> 
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
                  <Checkbox aria-label={`Select row ${lead.id}`} disabled />
                </TableCell>
                {leadColumns.slice(1, -1).map(col => (
                  <TableCell key={col.accessorKey}>
                    {renderCellContent(lead, col)}
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
                      <DropdownMenuItem
                        onClick={() => onEditLead(lead)}
                        disabled={!!currentUserId && !!lead.ownerUserId && lead.ownerUserId !== currentUserId && currentUserId !== 'DO-admin'}
                      >
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteLead(lead.id)}
                        disabled={!!currentUserId && !!lead.ownerUserId && lead.ownerUserId !== currentUserId && currentUserId !== 'DO-admin'}
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
