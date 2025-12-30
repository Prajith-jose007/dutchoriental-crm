
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
  isPackageQuantityColumn?: boolean;
  actualPackageName?: string;
  yachtCategory?: string;
  isJsonDetails?: boolean;
};

export const packageHeaderMap: { [fullPackageName: string]: string } = {
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
  'VIP': 'VIP',
  'HOUR CHARTER': 'HrChtr',
};


export const generateLeadColumns = (allYachts: Yacht[]): LeadTableColumn[] => {
  const columns: LeadTableColumn[] = [];

  const baseInfoColumns: LeadTableColumn[] = [
    { accessorKey: 'select', header: '' },
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'checkInStatus', header: 'Check-In' },
    { accessorKey: 'month', header: 'Date', isShortDate: true },
    { accessorKey: 'yacht', header: 'Yacht', isYachtLookup: true },
    { accessorKey: 'agent', header: 'Agent', isAgentLookup: true },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'paymentConfirmationStatus', header: 'Payment/Conf. Status' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'transactionId', header: 'Transaction ID' },
    { accessorKey: 'bookingRefNo', header: 'Booking REF No:' },
    { accessorKey: 'modeOfPayment', header: 'Payment Mode' },
    { accessorKey: 'freeGuestCount', header: 'Free', isNumeric: true },
  ];
  columns.push(...baseInfoColumns);

  const addPackageColumns = (pkgDef: { actualPackageName: string; category: string }) => {
    if (allYachts.some(y => y.category === pkgDef.category && y.packages?.some(p => p.name === pkgDef.actualPackageName))) {
      const shortHeader = packageHeaderMap[pkgDef.actualPackageName] || pkgDef.actualPackageName.substring(0, 6);
      const baseAccessorKey = pkgDef.actualPackageName.replace(/\s+/g, '_').toLowerCase();

      columns.push({
        header: `${shortHeader} Qty`,
        accessorKey: `pkgqty_${baseAccessorKey}`,
        isPackageQuantityColumn: true,
        actualPackageName: pkgDef.actualPackageName,
        isNumeric: true,
        yachtCategory: pkgDef.category,
      });
    }
  };

  const dinnerCruisePackageDefinitions = [
    { actualPackageName: 'CHILD', category: 'Dinner Cruise' }, { actualPackageName: 'ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'CHILD TOP DECK', category: 'Dinner Cruise' }, { actualPackageName: 'ADULT TOP DECK', category: 'Dinner Cruise' },
    { actualPackageName: 'ADULT ALC', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP CHILD', category: 'Dinner Cruise' }, { actualPackageName: 'VIP ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP ALC', category: 'Dinner Cruise' },
    { actualPackageName: 'ROYAL CHILD', category: 'Dinner Cruise' }, { actualPackageName: 'ROYAL ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'ROYAL ALC', category: 'Dinner Cruise' }
  ];
  dinnerCruisePackageDefinitions.forEach(addPackageColumns);

  const sightseeingPackageDefinitions = [
    { actualPackageName: 'BASIC', category: 'Superyacht Sightseeing Cruise' }, { actualPackageName: 'STANDARD', category: 'Superyacht Sightseeing Cruise' },
    { actualPackageName: 'PREMIUM', category: 'Superyacht Sightseeing Cruise' }, { actualPackageName: 'VIP', category: 'Superyacht Sightseeing Cruise' }
  ];
  sightseeingPackageDefinitions.forEach(addPackageColumns);

  const privateCharterPackageDefinitions = [
    { actualPackageName: 'HOUR CHARTER', category: 'Private Cruise' }
  ];
  privateCharterPackageDefinitions.forEach(addPackageColumns);

  const explicitPackageNames = new Set([
    ...dinnerCruisePackageDefinitions.map(p => p.actualPackageName),
    ...sightseeingPackageDefinitions.map(p => p.actualPackageName),
    ...privateCharterPackageDefinitions.map(p => p.actualPackageName)
  ]);
  const otherPackagesFound = new Map<string, { category?: string }>();
  allYachts.forEach(yacht => {
    yacht.packages?.forEach(pkg => {
      if (pkg.name && !explicitPackageNames.has(pkg.name) && pkg.name !== "Soft Drinks Package pp") {
        if (!otherPackagesFound.has(pkg.name)) {
          otherPackagesFound.set(pkg.name, { category: yacht.category });
        }
      }
    });
  });
  otherPackagesFound.forEach((pkgDetails, pkgName) => {
    addPackageColumns({ actualPackageName: pkgName, category: pkgDetails.category || 'Unknown' });
  });


  const accountsColumns: LeadTableColumn[] = [
    { accessorKey: 'totalGuestsCalculated', header: 'Total Count', isNumeric: true },
    { accessorKey: 'perTicketRate', header: 'Addon Pack', isCurrency: true },
    { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
    { accessorKey: 'averageRateCalculated', header: 'Rate', isCurrency: true },
    { accessorKey: 'commissionPercentage', header: 'Discount %', isPercentage: true },
    { accessorKey: 'commissionAmount', header: 'Commission', isCurrency: true },
    { accessorKey: 'netAmount', header: 'Net Amt', isCurrency: true },
    { accessorKey: 'paidAmount', header: 'Paid', isCurrency: true },
    { accessorKey: 'balanceAmount', header: 'Balance', isCurrency: true },
  ];
  columns.push(...accountsColumns);

  const referencesAndCommentsColumns: LeadTableColumn[] = [
    { accessorKey: 'notes', header: 'Note', isNotes: true },
    { accessorKey: 'ownerUserId', header: 'Created By', isUserLookup: true },
    { accessorKey: 'lastModifiedByUserId', header: 'Modified By', isUserLookup: true },
    { accessorKey: 'createdAt', header: 'Date of Creation', isDate: true },
    { accessorKey: 'updatedAt', header: 'Date of Modification', isDate: true },
    { accessorKey: 'package_quantities_json', header: 'Package Details (JSON)', isJsonDetails: true },
  ];
  columns.push(...referencesAndCommentsColumns);

  columns.push({ accessorKey: 'actions', header: 'Actions' });
  return columns;
};


interface LeadsTableProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onGenerateInvoice: (lead: Lead) => void;
  userMap: { [id: string]: string };
  agentMap: { [id: string]: string };
  yachtMap: { [id: string]: string };
  allYachts: Yacht[];
  currentUserId?: string | null;
  isAdmin?: boolean;
  selectedLeadIds: string[];
  onSelectLead: (leadId: string, isSelected: boolean) => void;
  onSelectAllLeads: (isSelected: boolean) => void;
}

export function LeadsTable({
  leads,
  onEditLead,
  onDeleteLead,
  onGenerateInvoice,
  userMap,
  agentMap,
  yachtMap,
  allYachts,
  currentUserId,
  isAdmin,
  selectedLeadIds,
  onSelectLead,
  onSelectAllLeads,
}: LeadsTableProps) {

  const leadColumns = useMemo(() => generateLeadColumns(allYachts), [allYachts]);

  const getStatusVariant = (status?: LeadStatus) => {
    if (!status) return 'outline';
    switch (status) {
      case 'Unconfirmed': return 'destructive';
      case 'Confirmed': return 'secondary';
      case 'Closed (Won)': return 'success';
      case 'Closed (Lost)': return 'outline';
      default: return 'outline';
    }
  };

  const getPaymentConfirmationStatusVariant = (status?: PaymentConfirmationStatus) => {
    if (!status) return 'outline';
    switch (status) {
      case 'CONFIRMED': return 'default';
      case 'UNCONFIRMED': return 'destructive';
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
    if (column.isPackageQuantityColumn && column.actualPackageName) {
      const pkgQuantityItem = lead.packageQuantities?.find(pq => pq.packageName === column.actualPackageName);
      const quantity = pkgQuantityItem?.quantity;
      return (quantity !== undefined && quantity > 0) ? String(quantity) : '-';
    }

    if (column.isJsonDetails) {
      return lead.packageQuantities ? JSON.stringify(lead.packageQuantities) : '[]';
    }

    const value = lead[column.accessorKey as keyof Lead];

    if (column.accessorKey === 'totalGuestsCalculated') {
      const totalGuests = calculateTotalGuestsFromPackageQuantities(lead);
      return formatNumeric(totalGuests);
    }
    if (column.accessorKey === 'averageRateCalculated') {
      const totalGuests = calculateTotalGuestsFromPackageQuantities(lead);
      if (totalGuests > 0 && lead.totalAmount !== undefined && lead.totalAmount !== null) {
        const averageRate = lead.totalAmount / totalGuests;
        return formatCurrency(averageRate);
      }
      return '-';
    }
    if (column.accessorKey === 'freeGuestCount') {
      return formatNumeric(lead.freeGuestCount);
    }
    if (column.accessorKey === 'id') {
      const canEdit = isAdmin || (!lead.status.startsWith('Closed'));
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
    if (column.accessorKey === 'checkInStatus') {
      const status = lead.checkInStatus || 'Not Checked In';
      const isCheckedIn = status === 'Checked In';
      return (
        <Badge variant={isCheckedIn ? 'default' : 'outline'} className={isCheckedIn ? 'bg-green-600 hover:bg-green-700' : 'text-muted-foreground'}>
          {status}
        </Badge>
      );
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
    if (column.isNumeric && column.accessorKey !== 'totalGuestsCalculated' && column.accessorKey !== 'freeGuestCount' && !column.isPackageQuantityColumn) {
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

  const isAllSelected = leads.length > 0 && selectedLeadIds.length === leads.length;
  const isSomeSelected = selectedLeadIds.length > 0 && selectedLeadIds.length < leads.length;

  return (
    <ScrollArea className="rounded-md border whitespace-nowrap">
      <Table>
        <TableHeader>
          <TableRow>
            {leadColumns
              .filter(col => !col.isJsonDetails)
              .map(col => (
                <TableHead key={col.accessorKey} className={col.accessorKey === 'select' ? "w-[40px]" : ""}>
                  {col.accessorKey === 'select' ? (
                    <Checkbox
                      aria-label="Select all rows"
                      checked={isAllSelected}
                      onCheckedChange={(checked) => onSelectAllLeads(Boolean(checked))}
                      data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                      disabled={leads.length === 0}
                    />
                  ) : col.header}
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={leadColumns.filter(col => !col.isJsonDetails).length} className="h-24 text-center">
                No bookings found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow
                key={lead.id}
                data-state={selectedLeadIds.includes(lead.id) ? "selected" : ""}
              >
                {leadColumns
                  .filter(col => !col.isJsonDetails)
                  .map(col => (
                    <TableCell key={`${lead.id}-${col.accessorKey}`}>
                      {col.accessorKey === 'select' ? (
                        <Checkbox
                          aria-label={`Select row ${lead.id}`}
                          checked={selectedLeadIds.includes(lead.id)}
                          onCheckedChange={(checked) => onSelectLead(lead.id, Boolean(checked))}
                        />
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
                              disabled={!isAdmin && lead.status.startsWith('Closed')}
                            >
                              {lead.status.startsWith('Closed') && !isAdmin ? 'View Details' : 'Edit Booking'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onGenerateInvoice(lead)}>
                              Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDeleteLead(lead.id)}
                              disabled={!isAdmin && lead.status.startsWith('Closed')}
                            >
                              Delete Booking
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
