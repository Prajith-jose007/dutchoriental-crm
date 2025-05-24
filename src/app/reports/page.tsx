
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
import { placeholderUsers } from '@/lib/placeholder-data';
import { getMonth, getYear, format, parseISO, isWithinInterval, startOfMonth, endOfMonth, startOfYear, endOfYear, isValid } from 'date-fns';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers';

export default function ReportsPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [userMap, setUserMap] = useState<{ [id: string]: string }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
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

        
        let usersToMap: User[] = placeholderUsers;
        try {
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            if (storedUsers) {
                const parsedUsers: User[] = JSON.parse(storedUsers);
                if (Array.isArray(parsedUsers)) usersToMap = parsedUsers;
            }
        } catch (e) { console.error("Error parsing users from localStorage for map:", e); }
        
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


  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      let leadEventDate: Date | null = null;
      try {
        if(lead.month && isValid(parseISO(lead.month))) {
          leadEventDate = parseISO(lead.month);
        }
      } catch(e) { console.warn(`Invalid event date for lead ${lead.id}: ${lead.month}`); }

      if (startDate && endDate && leadEventDate && !isWithinInterval(leadEventDate, { start: startDate, end: endDate })) return false;
      
      if (selectedYachtId !== 'all' && lead.yacht !== selectedYachtId) return false;
      if (selectedAgentId !== 'all' && lead.agent !== selectedAgentId) return false;
      if (selectedUserId !== 'all' && lead.lastModifiedByUserId !== selectedUserId) return false;
      return true;
    });
  }, [allLeads, startDate, endDate, selectedYachtId, selectedAgentId, selectedUserId]);

  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(invoice => {
      let invoiceCreationDate: Date | null = null;
       try {
          if(invoice.createdAt && isValid(parseISO(invoice.createdAt))) {
            invoiceCreationDate = parseISO(invoice.createdAt);
          }
        } catch(e) { console.warn(`Invalid creation date for invoice ${invoice.id}: ${invoice.createdAt}`); }

       if (startDate && endDate && invoiceCreationDate && !isWithinInterval(invoiceCreationDate, { start: startDate, end: endDate })) return false;
       
      return true;
    });
  }, [allInvoices, startDate, endDate]);

  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedYachtId('all');
    setSelectedAgentId('all');
    setSelectedUserId('all');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Reports" description="Loading report data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
          {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
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
        <p className="text-destructive text-center py-10">Failed to load report data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="CRM Reports" 
        description="A consolidated view of key metrics and performance indicators." 
      />
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg shadow-sm">
        <div>
          <Label htmlFor="start-date-report">Start Date (Event/Invoice)</Label>
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
        </div>
        <div>
          <Label htmlFor="end-date-report">End Date (Event/Invoice)</Label>
          <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" disabled={(date) => startDate ? date < startDate : false} />
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

    