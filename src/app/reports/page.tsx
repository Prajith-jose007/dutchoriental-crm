
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from '../dashboard/_components/BookingReportChart';
import { InvoiceStatusPieChart } from '../dashboard/_components/InvoiceStatusPieChart';
import { SalesByYachtPieChart } from '../dashboard/_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from '../dashboard/_components/BookingsByAgentBarChart';
import { ReportSummaryStats } from './_components/ReportSummaryStats';
import { FilteredBookedAgentsList } from './_components/FilteredBookedAgentsList';
import { DailyBookingsStats } from '@/components/DailyBookingsStats';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lead, Invoice, Yacht, Agent, User, LeadStatus, LeadType } from '@/lib/types';
import { leadStatusOptions, leadTypeOptions } from '@/lib/types';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isValid, getYear as getFullYear, getMonth as getMonthIndex, startOfDay, endOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import { normalizeYachtName } from '@/lib/csvHelpers';


export default function ReportsPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedYachtId, setSelectedYachtId] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [selectedLeadTypeFilter, setSelectedLeadTypeFilter] = useState<LeadType | 'all'>('all');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: format(new Date(2000, i, 1), 'MMMM'),
  }));

  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('all');
  const [selectedReportYear, setSelectedReportYear] = useState<string>('all');

  const { hasPermission, isLoading: isAuthLoading } = useUserRole();
  const isAuthorized = true; // User request: Report page should be seen by all users
  const authChecked = true;

  // Stable today's date to prevent re-render loops when passing to components
  const today = useMemo(() => new Date(), []);


  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadsRes, invoicesRes, yachtsRes, agentsRes, usersRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/invoices'),
        fetch('/api/yachts'),
        fetch('/api/agents'),
        fetch('/api/users'),
      ]);

      if (!leadsRes.ok) throw new Error(`Failed to fetch bookings: ${leadsRes.statusText}`);
      if (!invoicesRes.ok) throw new Error(`Failed to fetch invoices: ${invoicesRes.statusText}`);
      if (!yachtsRes.ok) throw new Error(`Failed to fetch yachts: ${yachtsRes.statusText}`);
      if (!agentsRes.ok) throw new Error(`Failed to fetch agents: ${agentsRes.statusText}`);
      if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.statusText}`);

      const leadsData = await leadsRes.json();
      const invoicesData = await invoicesRes.json();
      const yachtsData = await yachtsRes.json();
      const agentsData = await agentsRes.json();
      const usersData: User[] = await usersRes.json();

      setAllLeads(Array.isArray(leadsData) ? leadsData : []);
      setAllInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
      setAllAgents(Array.isArray(agentsData) ? agentsData : []);

      const map: { [id: string]: string } = {};
      if (Array.isArray(usersData)) {
        usersData.forEach(user => { map[user.id] = user.name; });
      }
      setUserMap(map);

    } catch (err) {
      console.error("Error fetching report data:", err);
      setError((err as Error).message);
      toast({ title: 'Error Fetching Report Data', description: (err as Error).message, variant: 'destructive' });
      setAllLeads([]); setAllInvoices([]); setAllYachts([]); setAllAgents([]); setUserMap({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const filteredLeads = useMemo(() => {
    let leadsToFilter = allLeads;

    leadsToFilter = leadsToFilter.filter(lead => {
      let leadEventDate: Date | null = null;
      try {
        if (lead.month && isValid(parseISO(lead.month))) {
          leadEventDate = parseISO(lead.month);
        }
      } catch (e) { console.warn(`Invalid event date for booking ${lead.id} in reports: ${lead.month}`); }

      if (startDate || endDate) {
        if (!leadEventDate) return false;
        if (startDate && endDate) {
          if (leadEventDate < startOfDay(startDate) || leadEventDate > endOfDay(endDate)) return false;
        } else if (startDate) {
          if (leadEventDate < startOfDay(startDate)) return false;
        } else if (endDate) {
          if (leadEventDate > endOfDay(endDate)) return false;
        }
      }
      else if (!startDate && !endDate) {
        if (leadEventDate) {
          const leadYear = String(getFullYear(leadEventDate));
          const leadMonth = String(getMonthIndex(leadEventDate) + 1).padStart(2, '0');

          if (selectedReportYear !== 'all' && leadYear !== selectedReportYear) return false;
          if (selectedReportMonth !== 'all' && selectedReportYear !== 'all' && leadMonth !== selectedReportMonth) return false;
          if (selectedReportMonth !== 'all' && selectedReportYear === 'all' && leadMonth !== selectedReportMonth) return false;
        } else if (selectedReportMonth !== 'all' || selectedReportYear !== 'all') {
          return false;
        }
      }

      if (selectedYachtId !== 'all') {
        const selectedYacht = allYachts.find(y => y.id === selectedYachtId);
        const isIdMatch = lead.yacht === selectedYachtId;
        const leadYachtNorm = normalizeYachtName(lead.yacht || '');
        const selectedYachtNorm = selectedYacht ? normalizeYachtName(selectedYacht.name) : '';
        if (!isIdMatch && (!selectedYacht || leadYachtNorm !== selectedYachtNorm)) return false;
      }
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && (lead.lastModifiedByUserId !== selectedUserId && lead.ownerUserId !== selectedUserId)) return false;
      if (selectedStatusFilter !== 'all' && lead.status !== selectedStatusFilter) return false;
      if (selectedLeadTypeFilter !== 'all' && lead.type !== selectedLeadTypeFilter) return false;

      return true;
    });

    return leadsToFilter;
  }, [allLeads, startDate, endDate, selectedReportMonth, selectedReportYear, selectedYachtId, selectedAgentId, selectedUserId, selectedStatusFilter, selectedLeadTypeFilter]);

  const reportBreakdowns = useMemo(() => {
    const stats = {
      totalPax: 0,
      unfilteredTotalPax: 0,
      adults: 0,
      child: 0,
      infants: 0,
      vipAdult: 0,
      vipChild: 0,
      vipAlc: 0,
      nonVipAlc: 0,
      royalAdult: 0,
      royalChild: 0,
      royalAlc: 0,
      totalOnBoard: 0,
      totalNoShow: 0,
      paymentBreakout: {} as Record<string, number>
    };

    // Unfiltered Pax
    allLeads.forEach(lead => {
      if (lead.packageQuantities) {
        lead.packageQuantities.forEach(pq => stats.unfilteredTotalPax += (Number(pq.quantity) || 0));
      }
      stats.unfilteredTotalPax += (lead.freeGuestCount || 0);
      stats.unfilteredTotalPax += (lead.infantCount || 0);
    });

    filteredLeads.forEach(lead => {
      // Calculate individual lead pax total
      let leadPax = 0;
      if (lead.packageQuantities) {
        lead.packageQuantities.forEach(pq => {
          const qty = Number(pq.quantity) || 0;
          const pkgName = pq.packageName?.toUpperCase() || '';
          
          if (pkgName.includes('ROYAL') || pkgName.includes('RYL')) {
            if (pkgName.includes('ALC')) stats.royalAlc += qty;
            else if (pkgName.includes('CHILD')) stats.royalChild += qty;
            else stats.royalAdult += qty;
          } else if (pkgName.includes('VIP')) {
            if (pkgName.includes('ALC')) stats.vipAlc += qty;
            else if (pkgName.includes('CHILD')) stats.vipChild += qty;
            else stats.vipAdult += qty;
          } else if (pkgName.includes('ALC') || pkgName.includes('ALCOHOL')) {
            stats.nonVipAlc += qty;
          } else if (pkgName.includes('CHILD')) {
            stats.child += qty;
          } else {
            // Default Adult/Food
            stats.adults += qty;
          }
          leadPax += qty;
        });
      }
      const free = Number(lead.freeGuestCount || 0);
      const infants = Number(lead.infantCount || 0);
      leadPax += free + infants;
      
      // Calculate infant total
      stats.infants += infants;
      
      // Update totals
      stats.totalPax += leadPax;

      // On Board vs No Show (Pax Based)
      // "checked in meaning onboarded if not on that day should be noshow"
      if (lead.checkInStatus === 'Checked In') {
        stats.totalOnBoard += leadPax;
      } else {
        stats.totalNoShow += leadPax;
      }

      // Payment Breakout
      const mop = lead.modeOfPayment || 'OTHER';
      stats.paymentBreakout[mop] = (stats.paymentBreakout[mop] || 0) + (lead.netAmount || 0);
      
      // Pay at Counter specifics
      if (lead.payAtCounterAmount) {
        stats.paymentBreakout['PAY AT COUNTER'] = (stats.paymentBreakout['PAY AT COUNTER'] || 0) + Number(lead.payAtCounterAmount);
      }
    });

    return stats;
  }, [filteredLeads, allLeads]);

  const filteredInvoices = useMemo(() => {
    const relevantLeadIds = new Set(filteredLeads.map(lead => lead.id));

    const invoicesToFilter = allInvoices.filter(invoice => {
      let invoiceCreationDate: Date | null = null;
      try {
        if (invoice.createdAt && isValid(parseISO(invoice.createdAt))) {
          invoiceCreationDate = parseISO(invoice.createdAt);
        }
      } catch (e) { console.warn(`Invalid creation date for invoice ${invoice.id}: ${invoice.createdAt}`); }

      if (startDate || endDate) {
        if (!invoiceCreationDate) return false;
        if (startDate && endDate) {
          if (invoiceCreationDate < startOfDay(startDate) || invoiceCreationDate > endOfDay(endDate)) return false;
        } else if (startDate) {
          if (invoiceCreationDate < startOfDay(startDate)) return false;
        } else if (endDate) {
          if (invoiceCreationDate > endOfDay(endDate)) return false;
        }
      }
      else if (!startDate && !endDate) {
        if (invoiceCreationDate) {
          const invoiceYear = String(getFullYear(invoiceCreationDate));
          const invoiceMonth = String(getMonthIndex(invoiceCreationDate) + 1).padStart(2, '0');

          if (selectedReportYear !== 'all' && invoiceYear !== selectedReportYear) return false;
          if (selectedReportMonth !== 'all' && selectedReportYear !== 'all' && invoiceMonth !== selectedReportMonth) return false;
          if (selectedReportMonth !== 'all' && selectedReportYear === 'all' && invoiceMonth !== selectedReportMonth) return false;

        } else if (selectedReportMonth !== 'all' || selectedReportYear !== 'all') {
          return false;
        }
      }
      return relevantLeadIds.has(invoice.leadId);
    });
    return invoicesToFilter;
  }, [allInvoices, filteredLeads, startDate, endDate, selectedReportMonth, selectedReportYear]);


  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedReportMonth('all');
    setSelectedReportYear('all');
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
    setSelectedStatusFilter('all');
    setSelectedLeadTypeFilter('all');
  };

  if (authChecked && !isAuthorized) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Reports" description="Access Denied" />
        <p className="text-destructive text-center py-10">You do not have permission to view reports.</p>
      </div>
    );
  }

  if (isLoading || !authChecked) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Reports" description="Loading report data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
          {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
          {[...Array(5)].map((_, i) => <Skeleton key={`stat-${i}`} className="h-24 w-full" />)}
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[350px] w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
          <Skeleton className="h-[350px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Reports" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load report data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Reports"
        description="Filter and view key metrics for your bookings and invoices."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
        <div>
          <Label htmlFor="start-date-report">Start Date (Event/Creation)</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
        </div>
        <div>
          <Label htmlFor="end-date-report">End Date (Event/Creation)</Label>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" disabled={(date) => startDate ? date < startDate : false} />
        </div>
        <div>
          <Label htmlFor="month-filter-report">Month</Label>
          <Select value={selectedReportMonth} onValueChange={setSelectedReportMonth} disabled={!!startDate || !!endDate}>
            <SelectTrigger id="month-filter-report"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {months.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year-filter-report">Year</Label>
          <Select value={selectedReportYear} onValueChange={setSelectedReportYear} disabled={!!startDate || !!endDate}>
            <SelectTrigger id="year-filter-report"><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status-filter-report">Booking Status</Label>
          <Select value={selectedStatusFilter} onValueChange={(value) => setSelectedStatusFilter(value as LeadStatus | 'all')}>
            <SelectTrigger id="status-filter-report" className="w-full">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {leadStatusOptions.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lead-type-filter-report">Booking Type</Label>
          <Select value={selectedLeadTypeFilter} onValueChange={(value) => setSelectedLeadTypeFilter(value as LeadType | 'all')}>
            <SelectTrigger id="lead-type-filter-report" className="w-full">
              <SelectValue placeholder="All Booking Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Booking Types</SelectItem>
              {leadTypeOptions.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="yacht-filter-report">Yacht</Label>
          <Select value={selectedYachtId} onValueChange={setSelectedYachtId}>
            <SelectTrigger id="yacht-filter-report"><SelectValue placeholder="All Yachts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Yachts</SelectItem>
              {allYachts.map(yacht => <SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="agent-filter-report">Agent</Label>
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger id="agent-filter-report"><SelectValue placeholder="All Agents" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {allAgents.map(agent => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="user-filter-report">User (Modified/Owner)</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-filter-report"><SelectValue placeholder="All Users" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {Object.entries(userMap).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={resetFilters} variant="outline" className="w-full">Reset Filters</Button>
        </div>
      </div>

      <ReportSummaryStats filteredLeads={filteredLeads} isLoading={isLoading} error={error} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Pax</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.totalPax}</div>
            <p className="text-[10px] text-muted-foreground">Unfiltered: {reportBreakdowns.unfilteredTotalPax}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Adult</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.adults}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-300">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Child</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.child}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-pink-300">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Infants</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.infants}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-300">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Alc (Non-VIP)</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.nonVipAlc}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">VIP Adult</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.vipAdult}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-300">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">VIP Child</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.vipChild}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-600">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">VIP Alc</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.vipAlc}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Royal Adult</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.royalAdult}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-400">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Royal Child</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.royalChild}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-800">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">Royal Alc</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.royalAlc}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">On Board</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.totalOnBoard}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-medium text-muted-foreground uppercase">No Show</CardTitle></CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">{reportBreakdowns.totalNoShow}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-2 lg:col-span-3 border-l-4 border-l-indigo-400 overflow-hidden">
          <CardHeader className="pb-1 pt-3 px-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Payment Details Breakout</CardTitle>
            <div className="text-[10px] font-bold text-indigo-600">TOTAL: {Object.values(reportBreakdowns.paymentBreakout).reduce((a, b) => a + b, 0).toLocaleString()} AED</div>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-[11px]">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(reportBreakdowns.paymentBreakout)
                .sort((a, b) => b[1] - a[1])
                .map(([mode, amt]) => (
                <div key={mode} className="flex flex-col border-b border-slate-100 py-1">
                  <span className="text-muted-foreground uppercase text-[9px]">{mode}</span>
                  <span className="font-mono font-bold text-sm">AED {amt.toLocaleString()}</span>
                </div>
              ))}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <DailyBookingsStats
          leads={allLeads}
          yachts={allYachts}
          date={startDate || today}
          title={startDate ? "Daily Report (Selected Date)" : "Daily Report (Today)"}
        />
      </div>

      <div className="grid gap-6 mt-6">
        <div className="grid gap-6 lg:grid-cols-1">
          <BookingReportChart leads={filteredLeads} isLoading={isLoading} error={error} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <InvoiceStatusPieChart invoices={filteredInvoices} isLoading={isLoading} error={error} />
          <SalesByYachtPieChart leads={filteredLeads} allYachts={allYachts} isLoading={isLoading} error={error} />
        </div>
        <div className="grid gap-6 lg:grid-cols-1">
          <BookingsByAgentBarChart leads={filteredLeads} allAgents={allAgents} isLoading={isLoading} error={error} />
        </div>
        <div className="grid gap-6 lg:grid-cols-1">
          <FilteredBookedAgentsList filteredLeads={filteredLeads} allAgents={allAgents} isLoading={isLoading} error={error} onRefresh={fetchAllData} />
        </div>
      </div>
    </div>
  );
}
