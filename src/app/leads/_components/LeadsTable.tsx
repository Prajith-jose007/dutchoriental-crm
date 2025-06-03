
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

export type LeadTableColumn = {
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
  yachtCategory?: string; 
};

// Mapping for desired short headers for specific package names
// This is used for display and export. For import, csvHeaderMapping in page.tsx handles it.
const packageHeaderMap: { [fullPackageName: string]: string } = {
  // Dinner Cruise Packages
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

  // Superyacht Sightseeing Packages
  'BASIC': 'BASIC',
  'STANDARD': 'STD',
  'PREMIUM': 'PREM',
  'VIP': 'VIP', // 'VIP' is distinct for sightseeing

  // Private Cruise Packages
  'HOUR CHARTER': 'HrChtr', // For Private Cruise type
  // Add other full package names from your system that you want short headers for
  // e.g., 'Soft Drinks Package pp': 'SoftDrinks',
};


export const generateLeadColumns = (allYachts: Yacht[]): LeadTableColumn[] => {
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

  const uniquePackages = new Map<string, { name: string, category?: string }>();
  allYachts.forEach(yacht => {
    yacht.packages?.forEach(pkg => {
      if (pkg.name && !uniquePackages.has(pkg.name)) {
        uniquePackages.set(pkg.name, { name: pkg.name, category: yacht.category });
      }
    });
  });

  const packageColumns: LeadTableColumn[] = [];
  
  // Add columns based on packageHeaderMap first to ensure preferred order/naming
  Object.entries(packageHeaderMap).forEach(([fullPackageName, shortHeader]) => {
      if (uniquePackages.has(fullPackageName)) {
          const pkgInfo = uniquePackages.get(fullPackageName)!;
          packageColumns.push({
              header: shortHeader,
              accessorKey: `pkgqty_${fullPackageName.replace(/\s+/g, '_').toLowerCase()}`,
              isPackageColumn: true,
              actualPackageName: fullPackageName,
              isNumeric: true,
              yachtCategory: pkgInfo.category,
          });
          uniquePackages.delete(fullPackageName); // Remove from map so it's not added again
      }
  });

  // Add any remaining unique packages that weren't in packageHeaderMap
  uniquePackages.forEach(pkgInfo => {
      packageColumns.push({
          header: pkgInfo.name, // Use full name if no short header defined
          accessorKey: `pkgqty_${pkgInfo.name.replace(/\s+/g, '_').toLowerCase()}`,
          isPackageColumn: true,
          actualPackageName: pkgInfo.name,
          isNumeric: true,
          yachtCategory: pkgInfo.category,
      });
  });

  // Sort all package columns by category, then by header for some consistency
  packageColumns.sort((a, b) => {
    const categoryCompare = (a.yachtCategory || '').localeCompare(b.yachtCategory || '');
    if (categoryCompare !== 0) return categoryCompare;
    return a.header.localeCompare(b.header);
  });


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

  return [...baseColumns, ...packageColumns, ...accountColumns, ...referenceColumns];
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
    if (num === null || num === undefined || isNaN(num) || num === 0) { 
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
    
