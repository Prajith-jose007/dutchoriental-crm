
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from '../dashboard/_components/BookingReportChart';
import { InvoiceStatusPieChart } from '../dashboard/_components/InvoiceStatusPieChart';
import { SalesByYachtPieChart } from '../dashboard/_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from '../dashboard/_components/BookingsByAgentBarChart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent, User } from '@/lib/types';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isValid, getYear as getFullYear, getMonth as getMonthIndex } from 'date-fns';
import { useToast } from '@/hooks/use-toast';


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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'), // "01", "02", ..., "12"
    label: format(new Date(2000, i, 1), 'MMMM'),
  }));

  const [selectedReportMonth, setSelectedReportMonth] = useState<string>('all');
  const [selectedReportYear, setSelectedReportYear] = useState<string>('all');


  useEffect(() => {
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

        if (!leadsRes.ok) throw new Error(`Failed to fetch leads: ${leadsRes.statusText}`);
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
    fetchAllData();
  }, [toast]);


  const initiallyFilteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      let leadEventDate: Date | null = null;
      try {
        if(lead.month && isValid(parseISO(lead.month))) {
          leadEventDate = parseISO(lead.month);
        }
      } catch(e) { console.warn(`Invalid event date for lead ${lead.id} in reports: ${lead.month}`); }

      // Date range filter (takes precedence)
      if (startDate && endDate && leadEventDate) {
         if (!isWithinInterval(leadEventDate, { start: startDate, end: endDate })) return false;
      } else if (startDate && leadEventDate) {
        if (leadEventDate < startDate) return false;
      } else if (endDate && leadEventDate) {
         if (leadEventDate > endDate) return false;
      }
      // Month/Year filter (if no date range)
      else if (!startDate && !endDate) {
        if (leadEventDate) {
            const leadYear = String(getFullYear(leadEventDate));
            const leadMonth = String(getMonthIndex(leadEventDate) + 1).padStart(2, '0');

            if (selectedReportYear !== 'all' && leadYear !== selectedReportYear) return false;
            if (selectedReportMonth !== 'all' && selectedReportYear !== 'all' && leadMonth !== selectedReportMonth) return false;
             // If only month is selected, filter by that month across all years (unless year is also selected)
            if (selectedReportMonth !== 'all' && selectedReportYear === 'all' && leadMonth !== selectedReportMonth) return false;
        } else if (selectedReportMonth !== 'all' || selectedReportYear !== 'all') {
            // If filtering by month/year but lead has no valid event date, exclude it
            return false;
        }
      }
      
      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && lead.lastModifiedByUserId !== selectedUserId) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedReportMonth, selectedReportYear, selectedYachtId, selectedAgentId, selectedUserId]);

  const filteredLeads = useMemo(() => {
    const leadsFromClosedOrConformed = initiallyFilteredLeads.filter(
        lead => lead.status === 'Closed' || lead.status === 'Conformed'
    );
    console.log(`[ReportsPage] Initially filtered leads: ${initiallyFilteredLeads.length}, Closed/Conformed leads: ${leadsFromClosedOrConformed.length}`);
    return leadsFromClosedOrConformed;
  }, [initiallyFilteredLeads]);

  const filteredInvoices = useMemo(() => {
    const closedOrConformedLeadIds = new Set(filteredLeads.map(lead => lead.id));
    console.log(`[ReportsPage] Lead IDs for Closed/Conformed leads:`, Array.from(closedOrConformedLeadIds));

    const invoicesForFilteredLeads = allInvoices.filter(invoice => {
       let invoiceCreationDate: Date | null = null;
       try {
          if(invoice.createdAt && isValid(parseISO(invoice.createdAt))) {
            invoiceCreationDate = parseISO(invoice.createdAt);
          }
        } catch(e) { console.warn(`Invalid creation date for invoice ${invoice.id}: ${invoice.createdAt}`); }

       if (startDate && endDate && invoiceCreationDate) {
         if (!isWithinInterval(invoiceCreationDate, { start: startDate, end: endDate })) return false;
       } else if (startDate && invoiceCreationDate) {
         if (invoiceCreationDate < startDate) return false;
       } else if (endDate && invoiceCreationDate) {
         if (invoiceCreationDate > endDate) return false;
       }
        // Month/Year filter (if no date range) for invoices based on createdAt
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
      
      // Finally, check if the invoice is linked to one of the "Closed" or "Conformed" leads
      return closedOrConformedLeadIds.has(invoice.leadId);
    });
    console.log(`[ReportsPage] Total invoices: ${allInvoices.length}, Invoices for Closed/Conformed leads matching filters: ${invoicesForFilteredLeads.length}`);
    return invoicesForFilteredLeads;
  }, [allInvoices, filteredLeads, startDate, endDate, selectedReportMonth, selectedReportYear]);


  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedReportMonth('all');
    setSelectedReportYear('all');
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Reports" description="Loading report data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
          {[...Array(7)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[350px] w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
          <Skeleton className="h-[350px] w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Reports" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load report data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="CRM Reports" 
        description="Key metrics for 'Closed' or 'Conformed' leads. Use filters to refine your view." 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
        <div>
          <Label htmlFor="start-date-report">Start Date (Lead Event / Invoice Creation)</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
        </div>
        <div>
          <Label htmlFor="end-date-report">End Date (Lead Event / Invoice Creation)</Label>
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
          <Label htmlFor="user-filter-report">User (Modified Lead)</Label>
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

      <div className="grid gap-6">
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
      </div>
    </div>
  );
}
