
'use client';

import { useMemo } from 'react';
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
import type { Lead, LeadStatus, Yacht, YachtPackageItem, PaymentConfirmationStatus } from '@/lib/types';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, parseISO, isValid } from 'date-fns';

type LeadTableColumn = {
  accessorKey: string; 
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
  isPackageColumn?: boolean; 
  actualPackageName?: string; 
};

const preferredPackageMap: { header: string; dataName: string }[] = [
  { header: 'CH', dataName: 'CHILD' },
  { header: 'AD', dataName: 'ADULT' },
  { header: 'AD ALC', dataName: 'AD ALC' },
  { header: 'VIP CH', dataName: 'VIP CH' },
  { header: 'VIP AD', dataName: 'VIP AD' },
  { header: 'VIP ALC', dataName: 'VIP ALC' },
  { header: 'ROYAL CH', dataName: 'ROYAL CH' },
  { header: 'ROYAL AD', dataName: 'ROYAL AD' },
  { header: 'ROYAL ALC', dataName: 'ROYAL ALC' },
];

const generateLeadColumns = (allYachts: Yacht[]): LeadTableColumn[] => {
  const baseColumnsPart1: LeadTableColumn[] = [
    { accessorKey: 'select', header: '' },
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'agent', header: 'Agent', isAgentLookup: true },
    { accessorKey: 'yacht', header: 'Yacht', isYachtLookup: true },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'month', header: 'Lead/Event Date', isShortDate: true },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'paymentConfirmationStatus', header: 'Pay Status' },
    { accessorKey: 'transactionId', header: 'Transaction ID' },
    { accessorKey: 'modeOfPayment', header: 'Payment Mode' },
    { accessorKey: 'totalGuests', header: 'Total Guests', isNumeric: true },
  ];

  const allActualUniquePackageNames = Array.from(
    new Set(
      allYachts.flatMap(yacht => yacht.packages?.map(pkg => pkg.name.trim()) || []).filter(name => name)
    )
  );

  const dynamicPackageColumns: LeadTableColumn[] = [];
  const addedDataNames = new Set<string>();

  preferredPackageMap.forEach(preferredPkg => {
    if (allActualUniquePackageNames.includes(preferredPkg.dataName)) {
      dynamicPackageColumns.push({
        header: preferredPkg.header, 
        accessorKey: `pkg_${preferredPkg.dataName.replace(/\s+/g, '_').toLowerCase()}`,
        isPackageColumn: true,
        actualPackageName: preferredPkg.dataName, 
        isNumeric: true,
      });
      addedDataNames.add(preferredPkg.dataName);
    }
  });

  allActualUniquePackageNames.sort().forEach(actualName => {
    if (!addedDataNames.has(actualName)) {
      dynamicPackageColumns.push({
        header: actualName, 
        accessorKey: `pkg_${actualName.replace(/\s+/g, '_').toLowerCase()}`,
        isPackageColumn: true,
        actualPackageName: actualName,
        isNumeric: true,
      });
    }
  });
  
  const financialColumns: LeadTableColumn[] = [
    { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
    { accessorKey: 'commissionPercentage', header: 'Agent Disc. %', isPercentage: true },
    { accessorKey: 'commissionAmount', header: 'Comm Amt', isCurrency: true },
    { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
    { accessorKey: 'paidAmount', header: 'Paid Amt', isCurrency: true },
    { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true },
  ];

  const auditAndActionColumns: LeadTableColumn[] = [
    { accessorKey: 'notes', header: 'Notes', isNotes: true },
    { accessorKey: 'lastModifiedByUserId', header: 'Modified By', isUserLookup: true },
    { accessorKey: 'ownerUserId', header: 'Lead Owner', isUserLookup: true },
    { accessorKey: 'createdAt', header: 'Created At', isDate: true },
    { accessorKey: 'updatedAt', header: 'Updated At', isDate: true },
    { accessorKey: 'actions', header: 'Actions' },
  ];

  return [...baseColumnsPart1, ...dynamicPackageColumns, ...financialColumns, ...auditAndActionColumns];
};


interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  userMap: { [id: string]: string };
  agentMap: { [id: string]: string };
  yachtMap: { [id: string]: string };
  allYachts: Yacht[];
  currentUserId?: string | null;
  isAdmin?: boolean;
}

export function LeadsTable({
  leads,
  onEditLead,
  onDeleteLead,
  userMap,
  agentMap,
  yachtMap,
  allYachts,
  currentUserId,
  isAdmin
}: LeadsTableProps) {

  const leadColumns = useMemo(() => generateLeadColumns(allYachts), [allYachts]);

  const getStatusVariant = (status?: LeadStatus) => {
    if (!status) return 'outline';
    switch (status) {
      case 'Balance': return 'secondary';
      case 'Closed': return 'default';
      default: return 'outline';
    }
  };
  
  const getPaymentConfirmationStatusVariant = (status?: PaymentConfirmationStatus) => {
    if (!status) return 'outline';
    switch (status) {
      case 'PAID': return 'default'; 
      case 'CONFIRMED': return 'secondary'; 
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
      return '0'; 
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

  const calculateTotalGuestsFromPackageQuantities = (lead: Lead): number => {
    if (!lead.packageQuantities || lead.packageQuantities.length === 0) return 0;
    return lead.packageQuantities.reduce((sum, pq) => sum + (Number(pq.quantity) || 0), 0);
  };

  const renderCellContent = (lead: Lead, column: LeadTableColumn) => {
    if (column.isPackageColumn && column.actualPackageName) {
      const pkgQuantity = lead.packageQuantities?.find(pq => pq.packageName === column.actualPackageName);
      return formatNumeric(pkgQuantity?.quantity);
    }
    
    const value = lead[column.accessorKey as keyof Lead];

    if (column.accessorKey === 'totalGuests') {
      return formatNumeric(calculateTotalGuestsFromPackageQuantities(lead));
    }
    if (column.accessorKey === 'id') {
      const canEdit = isAdmin || lead.ownerUserId === currentUserId;
      return (
        <Button variant="link" className="p-0 h-auto font-medium" onClick={() => onEditLead(lead)} disabled={!canEdit}>
          {String(lead.id).length > 10 ? String(lead.id).substring(0, 4) + '...' + String(lead.id).substring(String(lead.id).length - 4) : lead.id}
        </Button>
      );
    }
    if (column.accessorKey === 'status') {
      return <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>;
    }
    if (column.accessorKey === 'paymentConfirmationStatus') { 
      return <Badge variant={getPaymentConfirmationStatusVariant(lead.paymentConfirmationStatus)}>{lead.paymentConfirmationStatus}</Badge>;
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
      if (column.accessorKey === 'balanceAmount') {
        return formatCurrency(value as number | undefined);
      }
      return formatCurrency(Math.abs(value as number | undefined));
    }
    if (column.isPercentage) {
      return formatPercentage(value as number | undefined);
    }
    if (column.isNumeric && column.accessorKey !== 'totalGuests' && !column.isPackageColumn) { 
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
                {leadColumns.map(col => (
                  <TableCell key={`${lead.id}-${col.accessorKey}`}>
                    {col.accessorKey === 'select' ? (
                      <Checkbox aria-label={`Select row ${lead.id}`} disabled />
                    ) : col.accessorKey === 'actions' ? (
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
                            disabled={!(isAdmin || lead.ownerUserId === currentUserId)}
                          >
                            Edit Lead
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDeleteLead(lead.id)}
                            disabled={!isAdmin}
                          >
                            Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      renderCellContent(lead, col)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
