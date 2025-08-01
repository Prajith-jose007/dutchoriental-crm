
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { RevenueSummary } from './_components/RevenueSummary';
import { BookingReportChart } from './_components/BookingReportChart';
import { LatestInvoicesTable } from './_components/LatestInvoicesTable';
import { InvoiceStatusPieChart } from './_components/InvoiceStatusPieChart';
import { SalesByYachtPieChart } from './_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from './_components/BookingsByAgentBarChart';
import { BookedAgentsList } from './_components/BookedAgentsList';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent, User } from '@/lib/types';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    let isAuthenticated = false;
    try {
      isAuthenticated = !!localStorage.getItem(USER_ROLE_STORAGE_KEY);
    } catch (e) {
      console.error("Error accessing localStorage in dashboard for auth check:", e);
    }

    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      setIsAuthLoading(false); // Auth check complete
    }
  }, [router]);

  useEffect(() => {
    // Don't fetch data until authentication check is complete
    if (isAuthLoading) return; 

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
        
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAgents(Array.isArray(agentsData) ? agentsData : []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError((err as Error).message);
        setLeads([]);
        setInvoices([]);
        setYachts([]);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthLoading]); // Re-run fetch when authentication status is resolved
  
  if (isAuthLoading || (isLoading && leads.length === 0)) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Dashboard" description="Loading data..." />
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
          </div>
          <Skeleton className="h-[350px] w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-4">
              <Skeleton className="h-[300px] w-full" />
            </div>
            <div className="lg:col-span-3">
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) { 
     return (
      <div className="container mx-auto py-2">
        <PageHeader title="Dashboard" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load dashboard data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader title="Dashboard" description="An overview of your CRM's performance." />
      
      <div className="grid gap-6">
        <RevenueSummary leads={leads} isLoading={isLoading} error={error} />
        <BookingReportChart leads={leads} isLoading={isLoading} error={error} />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <LatestInvoicesTable invoices={invoices} isLoading={isLoading} error={error}/>
          </div>
          <div className="lg:col-span-3">
             <InvoiceStatusPieChart invoices={invoices} isLoading={isLoading} error={error}/>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
           <div className="lg:col-span-4">
            <BookingsByAgentBarChart leads={leads} allAgents={agents} isLoading={isLoading} error={error} />
          </div>
          <div className="lg:col-span-3">
            <SalesByYachtPieChart leads={leads} allYachts={yachts} isLoading={isLoading} error={error} />
          </div>
        </div>
        
        <BookedAgentsList leads={leads} allAgents={agents} isLoading={isLoading} error={error}/>

      </div>
    </div>
  );
}
