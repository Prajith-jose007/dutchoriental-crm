'use client';

import { useMemo, useState, useEffect } from 'react';
import { MoreHorizontal, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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

export type BookingTableColumn = {
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
  'ADULT ALC': 'AD ALC',
  'VIP CHILD': 'VIP CH',
  'VIP ADULT': 'VIP AD',
  'VIP ADULT ALC': 'VIP ALC', // Matched to Definition
  'VIP ALC': 'VIP ALC', // Fallback
  'ROYALE CHILD': 'RYL CH', // Matched to Definition
  'ROYAL CHILD': 'RYL CH', // Fallback
  'ROYALE ADULT': 'RYL AD', // Matched to Definition
  'ROYAL ADULT': 'RYL AD', // Fallback
  'ROYAL ALC': 'RYL ALC',
  'TOP CHILD': 'Top ch', // Matched to Definition
  'CHILD TOP DECK': 'Top ch', // Fallback
  'TOP ADULT': 'Top ad', // Matched to Definition
  'ADULT TOP DECK': 'Top ad', // Fallback
  'TOP ALC': 'Top alc', // Matched to Definition
  'ADULT TOP DECK ALC': 'Top alc', // Fallback
  'BASIC': 'Basic',
  'STANDARD': 'Standard',
  'PREMIUM': 'PREM',
  'VIP': 'VIP',
  'HOUR CHARTER': 'HrChtr',
};


export const generateBookingColumns = (allYachts: Yacht[]): BookingTableColumn[] => {
  const columns: BookingTableColumn[] = [];

  const baseInfoColumns: BookingTableColumn[] = [
    { accessorKey: 'select', header: '' },
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'checkInStatus', header: 'Check-In' },
    { accessorKey: 'month', header: 'Date', isShortDate: true },
    { accessorKey: 'yacht', header: 'Yacht', isYachtLookup: true },
    { accessorKey: 'agent', header: 'Agent', isAgentLookup: true },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'paymentConfirmationStatus', header: 'Confirmed' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'transactionId', header: 'Trans ID' },
    { accessorKey: 'bookingRefNo', header: 'REF' },
    { accessorKey: 'modeOfPayment', header: 'Mode' },
    { accessorKey: 'freeGuestCount', header: 'Free', isNumeric: true },
  ];
  columns.push(...baseInfoColumns);

  const addPackageColumns = (pkgDef: { actualPackageName: string; category: string }) => {
    if (allYachts.some(y => y.category === pkgDef.category && y.packages?.some(p => p.name.toUpperCase() === pkgDef.actualPackageName.toUpperCase()))) {
      const shortHeader = packageHeaderMap[pkgDef.actualPackageName.toUpperCase()] || pkgDef.actualPackageName;
      const baseAccessorKey = pkgDef.actualPackageName.replace(/\s+/g, '_').toLowerCase();

      columns.push({
        header: `${shortHeader}`,
        accessorKey: `pkgqty_${baseAccessorKey}`,
        isPackageQuantityColumn: true,
        actualPackageName: pkgDef.actualPackageName,
        isNumeric: true,
        yachtCategory: pkgDef.category,
      });
    }
  };

  const dinnerCruisePackageDefinitions = [
    { actualPackageName: 'CHILD', category: 'Dinner Cruise' },
    { actualPackageName: 'ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'ADULT ALC', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP CHILD', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'VIP ADULT ALC', category: 'Dinner Cruise' }, // Reverted to DB Name
    { actualPackageName: 'ROYALE CHILD', category: 'Dinner Cruise' },
    { actualPackageName: 'ROYALE ADULT', category: 'Dinner Cruise' },
    { actualPackageName: 'ROYAL ALC', category: 'Dinner Cruise' },
    { actualPackageName: 'CHILD TOP DECK', category: 'Dinner Cruise' }, // Using DB Name
    { actualPackageName: 'ADULT TOP DECK', category: 'Dinner Cruise' }, // Using DB Name
    { actualPackageName: 'ADULT TOP DECK ALC', category: 'Dinner Cruise' } // Using DB Name
  ];
  dinnerCruisePackageDefinitions.forEach(addPackageColumns);

  const sightseeingPackageDefinitions = [
    { actualPackageName: 'BASIC', category: 'Superyacht Sightseeing Cruise' },
    { actualPackageName: 'STANDARD', category: 'Superyacht Sightseeing Cruise' },
    { actualPackageName: 'VIP', category: 'Superyacht Sightseeing Cruise' }
  ];
  sightseeingPackageDefinitions.forEach(addPackageColumns);

  const privateCharterPackageDefinitions = [
    { actualPackageName: 'HOUR CHARTER', category: 'Private Cruise' }
  ];
  privateCharterPackageDefinitions.forEach(addPackageColumns);

  const explicitPackageNames = new Set([
    ...dinnerCruisePackageDefinitions.map(p => p.actualPackageName.toUpperCase()),
    ...sightseeingPackageDefinitions.map(p => p.actualPackageName.toUpperCase()),
    ...privateCharterPackageDefinitions.map(p => p.actualPackageName.toUpperCase()),
    // Exclude garbage/alias names
    'TOP -CH', 'TOP -', 'TOP AD', 'TOP ALC'
  ]);
  const otherPackagesFound = new Map<string, { category?: string }>();
  allYachts.forEach(yacht => {
    yacht.packages?.forEach(pkg => {
      const pName = pkg.name ? pkg.name.toUpperCase() : '';
      if (pName &&
        !explicitPackageNames.has(pName) &&
        pName !== "SOFT DRINKS PACKAGE PP" &&
        !pName.startsWith('TOP -') // Aggressively exclude any "Top -" variants that cause header issues
      ) {
        if (!otherPackagesFound.has(pkg.name)) {
          otherPackagesFound.set(pkg.name, { category: yacht.category });
        }
      }
    });
  });
  otherPackagesFound.forEach((pkgDetails, pkgName) => {
    addPackageColumns({ actualPackageName: pkgName, category: pkgDetails.category || 'Unknown' });
  });


  const accountsColumns: BookingTableColumn[] = [
    { accessorKey: 'totalGuestsCalculated', header: 'Booked', isNumeric: true },
    { accessorKey: 'arrivedGuestsCalculated', header: 'Arrived', isNumeric: true },
    { accessorKey: 'perTicketRate', header: 'Addon', isCurrency: true },
    { accessorKey: 'totalAmount', header: 'Total Amt', isCurrency: true },
    { accessorKey: 'averageRateCalculated', header: 'Rate', isCurrency: true },
    { accessorKey: 'commissionPercentage', header: 'Disc %', isPercentage: true },
    { accessorKey: 'commissionAmount', header: 'Comm.', isCurrency: true },
    { accessorKey: 'netAmount', header: 'Net', isCurrency: true },
    { accessorKey: 'paidAmount', header: 'Paid', isCurrency: true },
    { accessorKey: 'collectedAtCheckIn', header: 'Coll. @ Check-in', isCurrency: true },
    { accessorKey: 'balanceAmount', header: 'Bal', isCurrency: true },
  ];
  columns.push(...accountsColumns);

  const referencesAndCommentsColumns: BookingTableColumn[] = [
    { accessorKey: 'notes', header: 'Note', isNotes: true },
    { accessorKey: 'ownerUserId', header: 'Lead Owner', isUserLookup: true },
    { accessorKey: 'lastModifiedByUserId', header: 'Modified By', isUserLookup: true },
    { accessorKey: 'createdAt', header: 'Date of Creation', isDate: true },
    { accessorKey: 'updatedAt', header: 'Date of Modification', isDate: true },
    { accessorKey: 'package_quantities_json', header: 'Package Details (JSON)', isJsonDetails: true },
  ];
  columns.push(...referencesAndCommentsColumns);

  columns.push({ accessorKey: 'actions', header: 'Actions' });
  return columns;
};


interface BookingsTableProps {
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

export function BookingsTable({
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
}: BookingsTableProps) {

  const leadColumns = useMemo(() => generateBookingColumns(allYachts), [allYachts]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Default 50 items per page

  useEffect(() => {
    setCurrentPage(1);
  }, [leads]); // Reset to page 1 when data changes

  const totalPages = Math.ceil(leads.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = leads.slice(startIndex, startIndex + pageSize);

  const getStatusVariant = (status?: LeadStatus) => {
    if (!status) return 'outline';
    switch (status) {
      case 'New': return 'default';
      case 'Contacted':
      case 'Follow-up':
      case 'Quoted':
      case 'Negotiation':
      case 'In Progress':
      case 'Confirmed': return 'secondary';
      case 'Unconfirmed': return 'destructive';
      case 'Closed (Won)':
      case 'Checked In':
      case 'Completed': return 'success';
      case 'Closed (Lost)':
      case 'Lost': return 'outline';
      case 'Canceled': return 'destructive';
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


  const formatDateValue = (dateString?: string, includeTime: boolean = false) => {
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

  const calculateArrivedGuests = (lead: Lead): number => {
    if (!lead.checkedInQuantities || lead.checkedInQuantities.length === 0) return 0;
    return lead.checkedInQuantities.reduce((sum, cq) => sum + (Number(cq.quantity) || 0), 0);
  };

  const renderCellContent = (lead: Lead, column: BookingTableColumn) => {
    if (column.isPackageQuantityColumn && column.actualPackageName) {
      const pkgQuantityItem = lead.packageQuantities?.find(
        pq => pq.packageName.toUpperCase() === column.actualPackageName!.toUpperCase()
      );
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
    if (column.accessorKey === 'arrivedGuestsCalculated') {
      const arrived = calculateArrivedGuests(lead);
      if (arrived === 0) return '-';
      return formatNumeric(arrived);
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
      const breakdown = lead.freeGuestDetails?.filter(f => f.quantity > 0).map(f => `${f.type}: ${f.quantity}`).join(', ');
      return (
        <span title={breakdown || undefined}>
          {formatNumeric(lead.freeGuestCount)}
        </span>
      );
    }
    if (column.accessorKey === 'id') {
      const canEdit = isAdmin || (!lead.status.startsWith('Closed') && lead.status !== 'Completed');
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
      const isPartial = status === 'Partially Checked In';

      return (
        <Badge
          variant={isCheckedIn ? 'default' : isPartial ? 'secondary' : 'outline'}
          className={
            isCheckedIn ? 'bg-green-600 hover:bg-green-700 text-white' :
              isPartial ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                'text-muted-foreground'
          }
        >
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
    <div className="space-y-4">
      <ScrollArea className="rounded-md border whitespace-nowrap">
        <Table>
          <TableHeader>
            <TableRow>
              {leadColumns
                .filter((col: BookingTableColumn) => !col.isJsonDetails)
                .map((col: BookingTableColumn) => (
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
            {paginatedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={leadColumns.filter((col: BookingTableColumn) => !col.isJsonDetails).length} className="h-24 text-center">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  data-state={selectedLeadIds.includes(lead.id) ? "selected" : ""}
                >
                  {leadColumns
                    .filter((col: BookingTableColumn) => !col.isJsonDetails)
                    .map((col: BookingTableColumn) => (
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
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {selectedLeadIds.length} of {leads.length} row(s) selected.
          Showing {startIndex + 1} to {Math.min(startIndex + pageSize, leads.length)} of {leads.length} entries
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              className="h-8 w-[70px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 20, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
