
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
  actualPackageName?: string; // Used to fetch quantity for specific package
  yachtCategory?: string; // To group packages visually if needed, though table is flat
};

// Mapping for desired short headers for specific package names
const packageHeaderMap: { [fullPackageName: string]: string } = {
  'CHILD': 'CH',
  'ADULT': 'AD',
  'CHILD TOP DECK': 'CHD TOP',
  'ADULT TOP DECK': 'ADT TOP',
  'ADULT ALC': 'AD ALC',
  'VIP CHILD': 'VIP CH',
  'VIP ADULT': 'VIP AD',
  'VIP ALC': 'VIP ALC',
  'ROYAL CHILD': 'RYL CH',
  'ROYAL ADULT': 'RYL AD',
  'ROYAL ALC': 'RYL ALC',
  'BASIC': 'BASIC',
  'STANDARD': 'STD',
  'PREMIUM': 'PREM',
  'VIP': 'VIP', // For Superyacht Sightseeing 'VIP'
  'HOUR CHARTER': 'HrChtr',
};

const generateLeadColumns = (allYachts: Yacht[]): LeadTableColumn[] => {
  const baseColumns: LeadTableColumn[] = [
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
    { accessorKey: 'freeGuestCount', header: 'Free Guests', isNumeric: true },
  ];

  // Dynamically generate package columns based on all unique packages in the system
  const uniquePackages = new Map<string, { name: string, category?: string }>();
  allYachts.forEach(yacht => {
    yacht.packages?.forEach(pkg => {
      if (pkg.name && !uniquePackages.has(pkg.name)) {
        uniquePackages.set(pkg.name, { name: pkg.name, category: yacht.category });
      }
    });
  });

  const dinnerCruisePackages: LeadTableColumn[] = [];
  const sightseeingPackages: LeadTableColumn[] = [];
  const privateCharterPackages: LeadTableColumn[] = [];
  const otherPackageColumns: LeadTableColumn[] = [];

  uniquePackages.forEach(pkgInfo => {
    const header = packageHeaderMap[pkgInfo.name] || pkgInfo.name;
    const columnDef: LeadTableColumn = {
      header: header,
      accessorKey: `pkgqty_${pkgInfo.name.replace(/\s+/g, '_').toLowerCase()}`,
      isPackageColumn: true,
      actualPackageName: pkgInfo.name,
      isNumeric: true,
      yachtCategory: pkgInfo.category
    };
    if (pkgInfo.category === 'Dinner Cruise') dinnerCruisePackages.push(columnDef);
    else if (pkgInfo.category === 'Superyacht Sightseeing Cruise') sightseeingPackages.push(columnDef);
    else if (pkgInfo.category === 'Private Cruise') privateCharterPackages.push(columnDef);
    else otherPackageColumns.push(columnDef);
  });

  // Sort package columns within their categories for consistent order
  const sortPackageCols = (cols: LeadTableColumn[]) => cols.sort((a,b) => a.header.localeCompare(b.header));
  sortPackageCols(dinnerCruisePackages);
  sortPackageCols(sightseeingPackages);
  sortPackageCols(privateCharterPackages);
  sortPackageCols(otherPackageColumns);
  
  const allPackageColumns = [
    ...dinnerCruisePackages, 
    ...sightseeingPackages, 
    ...privateCharterPackages, 
    ...otherPackageColumns
  ];


  const accountColumns: LeadTableColumn[] = [
    { accessorKey: 'perTicketRate', header: 'Rate Per Tick', isCurrency: true },
    { accessorKey: 'totalGuestsCalculated', header: 'Total Count', isNumeric: true },
    { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
    { accessorKey: 'commissionPercentage', header: 'Discount %', isPercentage: true },
    { accessorKey: 'commissionAmount', header: 'Commission', isCurrency: true },
    { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
    { accessorKey: 'paidAmount', header: 'Paid', isCurrency: true },
    { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true },
  ];

  const referenceColumns: LeadTableColumn[] = [
    { accessorKey: 'notes', header: 'Note', isNotes: true },
    { accessorKey: 'ownerUserId', header: 'Created By', isUserLookup: true },
    { accessorKey: 'lastModifiedByUserId', header: 'Modified By', isUserLookup: true },
    { accessorKey: 'createdAt', header: 'Date of Creation', isDate: true },
    { accessorKey: 'updatedAt', header: 'Date of Modification', isDate: true },
    { accessorKey: 'actions', header: 'Actions' },
  ];

  return [...baseColumns, ...allPackageColumns, ...accountColumns, ...referenceColumns];
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
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value?: number | null) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return `${value.toFixed(1)}%`;
  }

  const formatNumeric = (num?: number | null): string => {
    if (num === null || num === undefined || isNaN(num) || num === 0) { // Show 0 as '-' or empty for packages
      return '-';
    }
    return String(num);
  };


  const formatDateValue = (dateString?: string, includeTime: boolean = true) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return dateString; 
      const dateFormat = includeTime ? 'dd/MM/yy HH:mm' : 'dd/MM/yy';
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

    if (column.accessorKey === 'totalGuestsCalculated') {
      const totalGuests = calculateTotalGuestsFromPackageQuantities(lead);
      return totalGuests > 0 ? String(totalGuests) : '-';
    }
    if (column.accessorKey === 'freeGuestCount') {
      return lead.freeGuestCount && lead.freeGuestCount > 0 ? String(lead.freeGuestCount) : '-';
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
      if (column.accessorKey === 'perTicketRate' && (value === null || value === undefined)) {
        return '-';
      }
      return formatCurrency(value as number | undefined | null);
    }
    if (column.isPercentage) {
      return formatPercentage(value as number | undefined);
    }
    if (column.isNumeric && column.accessorKey !== 'totalGuestsCalculated' && column.accessorKey !== 'freeGuestCount' && !column.isPackageColumn) { 
      return (value !== null && value !== undefined && !isNaN(Number(value))) ? String(value) : '-';
    }
    if (column.isNotes) {
      return formatNotes(value as string | undefined);
    }
    if (column.isUserLookup) {
      const userId = value as string | undefined;
      return userId ? userMap[userId] || userId : '-';
    }
    return value !== undefined && value !== null && String(value).trim() !== '' ? String(value) : '-';
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

    