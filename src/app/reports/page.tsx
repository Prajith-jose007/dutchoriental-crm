
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
import { DatePicker } from '@/components/ui/date-picker'; // New import
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent, User } from '@/lib/types';
import { placeholderUsers } from '@/lib/placeholder-data';
import { getMonth, getYear, format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers';

export default function ReportsPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // MM (01-12) or 'all'
  const [selectedYear, setSelectedYear] = useState<string>('all'); // YYYY or 'all'
  const [selectedYachtId, setSelectedYachtId] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [leadsRes, invoicesRes, yachtsRes, agentsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/invoices'),
          fetch('/api/yachts'),
          fetch('/api/agents'),
        ]);

        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        if (!invoicesRes.ok) throw new Error('Failed to fetch invoices');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');

        const leadsData = await leadsRes.json();
        const invoicesData = await invoicesRes.json();
        const yachtsData = await yachtsRes.json();
        const agentsData = await agentsRes.json();

        setAllLeads(Array.isArray(leadsData) ? leadsData : []);
        setAllInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);

        // Load users from localStorage for userMap (as before)
        const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
        let usersToMap: User[] = placeholderUsers;
        if (storedUsers) {
          try {
            const parsedUsers: User[] = JSON.parse(storedUsers);
            if (Array.isArray(parsedUsers)) usersToMap = parsedUsers;
          } catch (e) { console.error("Error parsing users from localStorage for map:", e); }
        }
        const map: { [id: string]: string } = {};
        usersToMap.forEach(user => { map[user.id] = user.name; });
        setUserMap(map);

      } catch (err) {
        console.error("Error fetching report data:", err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allLeads.forEach(lead => months.add(lead.month.substring(5, 7))); // Extract MM
    allInvoices.forEach(invoice => months.add(format(parseISO(invoice.createdAt), 'MM')));
    return Array.from(months).sort().map(m => ({ value: m, label: format(new Date(2000, parseInt(m)-1, 1), 'MMMM') }));
  }, [allLeads, allInvoices]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    allLeads.forEach(lead => years.add(lead.month.substring(0, 4))); // Extract YYYY
    allInvoices.forEach(invoice => years.add(format(parseISO(invoice.createdAt), 'yyyy')));
    return Array.from(years).sort((a,b) => parseInt(b) - parseInt(a)); // Descending
  }, [allLeads, allInvoices]);

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      const leadDate = parseISO(lead.createdAt);
      const leadMonthYear = lead.month; // YYYY-MM

      if (startDate && endDate && !isWithinInterval(leadDate, { start: startDate, end: endDate })) return false;
      if (!startDate && !endDate) { // Only apply month/year if no date range
        if (selectedMonth !== 'all' && leadMonthYear.substring(5,7) !== selectedMonth) return false;
        if (selectedYear !== 'all' && leadMonthYear.substring(0,4) !== selectedYear) return false;
      }
      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && lead.lastModifiedByUserId !== selectedUserId) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedMonth, selectedYear, selectedYachtId, selectedAgentId, selectedUserId]);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.createdAt);
       if (startDate && endDate && !isWithinInterval(invoiceDate, { start: startDate, end: endDate })) return false;
       if (!startDate && !endDate) {
        if (selectedMonth !== 'all' && format(invoiceDate, 'MM') !== selectedMonth) return false;
        if (selectedYear !== 'all' && format(invoiceDate, 'yyyy') !== selectedYear) return false;
      }
      // Invoice specific filters can be added here if needed (e.g. client name, etc.)
      return true;
    });
  }, [allInvoices, startDate, endDate, selectedMonth, selectedYear]);

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Reports" description="Loading report data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(7)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
          <Skeleton className="h-10 w-full bg-primary/20" />
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
        <p className="text-destructive">Failed to load report data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="CRM Reports" 
        description="A consolidated view of key metrics and performance indicators." 
      />
      
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
        <div>
          <Label htmlFor="start-date">Start Date</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
        </div>
        <div>
          <Label htmlFor="end-date">End Date</Label>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" disabled={(date) => startDate ? date < startDate : false} />
        </div>
        <div>
          <Label htmlFor="month-filter">Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!!(startDate && endDate)}>
            <SelectTrigger id="month-filter"><SelectValue placeholder="All Months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="year-filter">Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!!(startDate && endDate)}>
            <SelectTrigger id="year-filter"><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="yacht-filter">Yacht</Label>
          <Select value={selectedYachtId} onValueChange={setSelectedYachtId}>
            <SelectTrigger id="yacht-filter"><SelectValue placeholder="All Yachts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Yachts</SelectItem>
              {allYachts.map(yacht => <SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="agent-filter">Agent</Label>
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger id="agent-filter"><SelectValue placeholder="All Agents" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {allAgents.map(agent => <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="user-filter">User (Modified Lead)</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger id="user-filter"><SelectValue placeholder="All Users" /></SelectTrigger>
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
