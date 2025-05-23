
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from './_components/BookingReportChart';
import { RevenueSummary } from './_components/RevenueSummary';
import { PerformanceSummary } from './_components/PerformanceSummary';
import { InvoiceStatusPieChart } from './_components/InvoiceStatusPieChart';
import { LatestInvoicesTable } from './_components/LatestInvoicesTable';
import { SalesByYachtPieChart } from './_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from './_components/BookingsByAgentBarChart';
import type { Lead, Invoice, Yacht, Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
// placeholderInvoices is removed as invoices are now fetched via API
// import { placeholderInvoices } from '@/lib/placeholder-data'; 

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]); 
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data that has API endpoints
        const [leadsRes, yachtsRes, agentsRes, invoicesRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/yachts'),
          fetch('/api/agents'),
          fetch('/api/invoices'), 
        ]);

        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        if (!invoicesRes.ok) throw new Error('Failed to fetch invoices');


        const leadsData = await leadsRes.json();
        const yachtsData = await yachtsRes.json();
        const agentsData = await agentsRes.json();
        const invoicesData = await invoicesRes.json(); 

        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAgents(Array.isArray(agentsData) ? agentsData : []);
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError((err as Error).message);
        // Fallback for API driven data if fetch fails
        setLeads([]);
        setYachts([]);
        setAgents([]);
        setInvoices([]); // Fallback to empty if invoice API fails
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Dashboard" description="Loading data..." />
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-[120px] w-full" />)}
          </div>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-[120px] w-full" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
            <Skeleton className="h-[350px] w-full xl:col-span-3" />
            <Skeleton className="h-[350px] w-full xl:col-span-2" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[350px] w-full" />
            <Skeleton className="h-[350px] w-full" />
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (error && leads.length === 0 && yachts.length === 0 && agents.length === 0 && invoices.length === 0) { // Show main error if all primary data fails
     return (
      <div className="container mx-auto py-2">
        <PageHeader title="Dashboard" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load dashboard data: {error}</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <PageHeader title="Dashboard" description="Welcome to DutchOriental CRM. Here's an overview of your yacht business." />
      
      <div className="grid gap-6">
        <RevenueSummary leads={leads} isLoading={isLoading} error={error && leads.length === 0 ? error : null} />
        <PerformanceSummary leads={leads} invoices={invoices} isLoading={isLoading} error={error && (leads.length === 0 || invoices.length === 0) ? error : null} />
        
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <BookingReportChart leads={leads} isLoading={isLoading} error={error && leads.length === 0 ? error : null}/>
          </div>
          <div className="lg:col-span-1 xl:col-span-2">
            <InvoiceStatusPieChart invoices={invoices} isLoading={isLoading} error={error && invoices.length === 0 ? error : null} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SalesByYachtPieChart leads={leads} allYachts={yachts} isLoading={isLoading} error={error && (leads.length === 0 || yachts.length === 0) ? error : null} />
          </div>
          <div>
            <BookingsByAgentBarChart leads={leads} allAgents={agents} isLoading={isLoading} error={error && (leads.length === 0 || agents.length === 0) ? error : null} />
          </div>
        </div>
        
        <LatestInvoicesTable invoices={invoices} isLoading={isLoading} error={error && invoices.length === 0 ? error : null} />
      </div>
    </div>
  );
}
