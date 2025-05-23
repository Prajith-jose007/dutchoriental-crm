
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
import type { Lead } from '@/lib/types'; // Removed Yacht, Agent as they are fetched by parent or not directly used here for names
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Assuming agent and yacht names are resolved by the parent page or context if needed.
// For this table, we'll primarily display IDs or direct lead properties.

const leadColumns: { accessorKey: keyof Lead | 'actions' | 'select', header: string, isCurrency?: boolean, isPercentage?: boolean, isNumeric?: boolean }[] = [
  { accessorKey: 'select', header: '' },
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'clientName', header: 'Client' },
  { accessorKey: 'agent', header: 'Agent ID' }, // Displaying Agent ID
  { accessorKey: 'yacht', header: 'Yacht ID' }, // Displaying Yacht ID
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'type', header: 'Type' },
  { accessorKey: 'invoiceId', header: 'Invoice' },
  { accessorKey: 'modeOfPayment', header: 'Payment Mode' },
  
  // DHOW Packages
  { accessorKey: 'dhowChildQty', header: 'Dhow Child', isNumeric: true },
  { accessorKey: 'dhowAdultQty', header: 'Dhow Adult', isNumeric: true },
  { accessorKey: 'dhowVipQty', header: 'Dhow VIP', isNumeric: true },
  { accessorKey: 'dhowVipChildQty', header: 'Dhow VIP Child', isNumeric: true },
  { accessorKey: 'dhowVipAlcoholQty', header: 'Dhow VIP Alcohol', isNumeric: true },
  // OE Packages
  { accessorKey: 'oeChildQty', header: 'OE Child', isNumeric: true },
  { accessorKey: 'oeAdultQty', header: 'OE Adult', isNumeric: true },
  { accessorKey: 'oeVipQty', header: 'OE VIP', isNumeric: true },
  { accessorKey: 'oeVipChildQty', header: 'OE VIP Child', isNumeric: true },
  { accessorKey: 'oeVipAlcoholQty', header: 'OE VIP Alcohol', isNumeric: true },
  // SUNSET Packages
  { accessorKey: 'sunsetChildQty', header: 'Sunset Child', isNumeric: true },
  { accessorKey: 'sunsetAdultQty', header: 'Sunset Adult', isNumeric: true },
  { accessorKey: 'sunsetVipQty', header: 'Sunset VIP', isNumeric: true },
  { accessorKey: 'sunsetVipChildQty', header: 'Sunset VIP Child', isNumeric: true },
  { accessorKey: 'sunsetVipAlcoholQty', header: 'Sunset VIP Alcohol', isNumeric: true },
  // LOTUS Packages
  { accessorKey: 'lotusChildQty', header: 'Lotus Child', isNumeric: true },
  { accessorKey: 'lotusAdultQty', header: 'Lotus Adult', isNumeric: true },
  { accessorKey: 'lotusVipQty', header: 'Lotus VIP', isNumeric: true },
  { accessorKey: 'lotusVipChildQty', header: 'Lotus VIP Child', isNumeric: true },
  { accessorKey: 'lotusVipAlcoholQty', header: 'Lotus VIP Alcohol', isNumeric: true },
  // ROYAL Package
  { accessorKey: 'royalQty', header: 'Royal Pkg', isNumeric: true },
  // Other Charges
  { accessorKey: 'othersAmtCake', header: 'Other Charges', isCurrency: true },
  // Financials
  { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
  { accessorKey: 'commissionPercentage', header: 'Agent Disc. %', isPercentage: true },
  { accessorKey: 'commissionAmount', header: 'Comm Amt', isCurrency: true },
  { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
  { accessorKey: 'paidAmount', header: 'Paid Amt', isCurrency: true },
  { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true },
  { accessorKey: 'lastModifiedByUserId', header: 'Modified By'},
  { accessorKey: 'createdAt', header: 'Created At'},
  { accessorKey: 'updatedAt', header: 'Updated At'},
  { accessorKey: 'actions', header: 'Actions' },
];

interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

export function LeadsTable({ leads, onEditLead, onDeleteLead }: LeadsTableProps) {

  const getStatusVariant = (status: Lead['status']) => {
    switch (status) {
      case 'New': return 'outline';
      case 'Contacted': return 'secondary';
      case 'Qualified': return 'default'; 
      case 'Proposal Sent': return 'default'; 
      case 'Closed Won': return 'default'; 
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
  
  const formatNumeric = (value: number | undefined | null) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return String(value);
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString; // if parsing fails, show original
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
                    {col.accessorKey === 'id' ? (
                       <Button variant="link" className="p-0 h-auto font-medium" onClick={() => onEditLead(lead)}>
                        {lead.id && lead.id.length > 10 ? lead.id.substring(0,4) + '...' + lead.id.substring(lead.id.length-4) : lead.id}
                       </Button>
                    ) : col.accessorKey === 'status' ? (
                      <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                    ) : col.isCurrency ? (
                      formatCurrency(lead[col.accessorKey as keyof Lead] as number | undefined)
                    ) : col.isPercentage ? (
                        formatPercentage(lead[col.accessorKey as keyof Lead] as number | undefined)
                    ) : col.isNumeric ? (
                        formatNumeric(lead[col.accessorKey as keyof Lead] as number | undefined)
                    ) : col.accessorKey === 'createdAt' || col.accessorKey === 'updatedAt' ? (
                        formatDate(lead[col.accessorKey as keyof Lead] as string | undefined)
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
                      <DropdownMenuItem onClick={() => onDeleteLead(lead.id)}>
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
