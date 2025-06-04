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
  isJsonDetails?: boolean; // New flag for JSON details column
};

// Mapping for desired short headers for specific package names
export const packageHeaderMap: { [fullPackageName: string]: string } = {
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
  'ROYAL ALC': 'ROYAL ALC',

  // Superyacht Sightseeing Packages
  'BASIC': 'BASIC',
  'STANDARD': 'STD',
  'PREMIUM': 'PREM',
  'VIP': 'VIP', // 'VIP' is distinct for sightseeing

  // Private Cruise Packages
  'HOUR CHARTER': 'HrChtr',
};


export const generateLeadColumns = (allYachts: Yacht[]): LeadTableColumn[] => {
  const columns: LeadTableColumn[] = [];

  // Helper to add package columns if they exist on any yacht
  const addPackageColumn = (pkgDef: { actualPackageName: string, header?: string, category: string }) => {
    if (allYachts.some(y => y.packages?.some(p => p.name === pkgDef.actualPackageName))) {
      columns.push({
        header: packageHeaderMap[pkgDef.actualPackageName] || pkgDef.header || pkgDef.actualPackageName,
        accessorKey: `pkgqty_${pkgDef.actualPackageName.replace(/\s+/g, '_').toLowerCase()}`,
        isPackageColumn: true,
        actualPackageName: pkgDef.actualPackageName,
        isNumeric: true, // The quantity part is numeric
        yachtCategory: pkgDef.category,
      });
    }
  };

  // Base Info Columns
  columns.push(
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
    { accessorKey: 'freeGuestCount', header: 'Free Guests', isNumeric: true }
  );

  // Dinner Cruise Packages
  const dinnerCruisePackageDefinitions = [
    { actualPackageName: 'CHILD', category: 'Dinner Cruise' }, { actualPackageName: 'ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'CHILD TOP DECK', category: 'Dinner Cruise' }, { actualPackageName: 'ADULT TOP DECK', category: 'Dinner Cruise' },
    { actualPackageName: 'ADULT ALC', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP CHILD', category: 'Dinner Cruise' }, { actualPackageName: 'VIP ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP ALC', category: 'Dinner Cruise' },
    { actualPackageName: 'ROYAL CHILD', category: 'Dinner Cruise' }, { actualPackageName: 'ROYAL ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'ROYAL ALC', category: 'Dinner Cruise' }
  ];
  dinnerCruisePackageDefinitions.forEach(addPackageColumn);

  // Superyacht Sightseeing Packages
  const sightseeingPackageDefinitions = [
    { actualPackageName: 'BASIC', category: 'Superyacht Sightseeing Cruise' }, { actualPackageName: 'STANDARD', category: 'Superyacht Sightseeing Cruise' },
    { actualPackageName: 'PREMIUM', category: 'Superyacht Sightseeing Cruise' }, { actualPackageName: 'VIP', category: 'Superyacht Sightseeing Cruise' }
  ];
  sightseeingPackageDefinitions.forEach(addPackageColumn);

  // Private Charter Packages
  const privateCharterPackageDefinitions = [
    { actualPackageName: 'HOUR CHARTER', category: 'Private Cruise' }
  ];
  privateCharterPackageDefinitions.forEach(addPackageColumn);
  
  // "Other" packages - dynamically add any packages not in the explicit lists
  const explicitPackageNames = new Set([
    ...dinnerCruisePackageDefinitions.map(p => p.actualPackageName),
    ...sightseeingPackageDefinitions.map(p => p.actualPackageName),
    ...privateCharterPackageDefinitions.map(p => p.actualPackageName)
  ]);

  const otherPackages = new Map<string, { category: string }>();
  allYachts.forEach(yacht => {
    yacht.packages?.forEach(pkg => {
      if (pkg.name && !explicitPackageNames.has(pkg.name) && pkg.name !== "Soft Drinks Package pp") {
        if (!otherPackages.has(pkg.name)) {
            otherPackages.set(pkg.name, { category: yacht.category || 'Other' });
        }
      }
    });
  });
  otherPackages.forEach((pkgDetails, pkgName) => {
     addPackageColumn({ actualPackageName: pkgName, header: pkgName, category: pkgDetails.category });
  });


  // Accounts Columns
  columns.push(
    { accessorKey: 'perTicketRate', header: 'OTHER', isCurrency: true }, // Renamed "Rate Per Tick" to "OTHER"
    { accessorKey: 'totalGuestsCalculated', header: 'Total Count', isNumeric: true },
    { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
    { accessorKey: 'commissionPercentage', header: 'Discount %', isPercentage: true },
    { accessorKey: 'commissionAmount', header: 'Commission', isCurrency: true },
    { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
    { accessorKey: 'paidAmount', header: 'Paid', isCurrency: true },
    { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true }
  );

  // References and Comments Columns
  columns.push(
    { accessorKey: 'notes', header: 'Note', isNotes: true },
    { accessorKey: 'ownerUserId', header: 'Created By', isUserLookup: true },
    { accessorKey: 'lastModifiedByUserId', header: 'Modified By', isUserLookup: true },
    { accessorKey: 'createdAt', header: 'Date of Creation', isDate: true },
    { accessorKey: 'updatedAt', header: 'Date of Modification', isDate: true },
    { accessorKey: 'package_quantities_json', header: 'Package Details (JSON)', isJsonDetails: true } // For CSV export
  );
  
  // Actions Column
  columns.push({ accessorKey: 'actions', header: 'Actions' });

  return columns;
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
      const pkgQuantityItem = lead.packageQuantities?.find(pq => pq.packageName === column.actualPackageName);
      const quantity = pkgQuantityItem?.quantity;
      const rate = pkgQuantityItem?.rate;
      if (quantity !== undefined && quantity > 0 && rate !== undefined) {
        return `${quantity} @ ${formatCurrency(rate)}`;
      }
      return '-';
    }
    if (column.isJsonDetails) { // For CSV export, this column won't typically be rendered in UI
        return lead.packageQuantities ? JSON.stringify(lead.packageQuantities) : '[]';
    }


    const value = lead[column.accessorKey as keyof Lead];

    if (column.accessorKey === 'totalGuestsCalculated') {
      const totalGuests = calculateTotalGuestsFromPackageQuantities(lead);
      return formatNumeric(totalGuests);
    }
    if (column.accessorKey === 'freeGuestCount') {
      return formatNumeric(lead.freeGuestCount);
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
      // Specifically for 'OTHER' (perTicketRate), allow '-' if null/undefined
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
            {leadColumns
              .filter(col => !col.isJsonDetails) // Don't render JSON details column in UI table
              .map(col => (
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
              <TableCell colSpan={leadColumns.filter(col => !col.isJsonDetails).length} className="h-24 text-center">
                No leads found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                {leadColumns
                  .filter(col => !col.isJsonDetails) // Don't render JSON details column
                  .map(col => (
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
