
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from './_components/BookingReportChart';
import { RevenueSummary } from './_components/RevenueSummary';
import { PerformanceSummary } from './_components/PerformanceSummary';
import { InvoiceStatusPieChart } from './_components/InvoiceStatusPieChart';
import { LatestInvoicesTable } from './_components/LatestInvoicesTable';
import { SalesByYachtPieChart } from './_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from './_components/BookingsByAgentBarChart';
import { BookedAgentsList } from './_components/BookedAgentsList'; // New
import { MonthlyRevenueChart } from './_components/MonthlyRevenueChart'; // New
import type { Lead, Invoice, Yacht, Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

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
      isAuthenticated = !!localStorage.getItem('currentUserRole');
    } catch (e) {
      console.error("Error accessing localStorage in dashboard for auth check:", e);
    }

    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      setIsAuthLoading(false); 
    }
  }, [router]);

  useEffect(() => {
    if (isAuthLoading) return; 

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
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
        setLeads([]);
        setYachts([]);
        setAgents([]);
        setInvoices([]); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthLoading]); 
  
  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Dashboard" description="Loading data..." />
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {/* Adjusted for more cards */}
            {[...Array(4)].map((_,i) => <Skeleton key={`perf-sum-${i}`} className="h-[120px] w-full" />)}
          </div>
           <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            {[...Array(3)].map((_,i) => <Skeleton key={`rev-sum-${i}`} className="h-[120px] w-full" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2"> {/* Main charts area */}
            <Skeleton className="h-[350px] w-full" /> {/* Booking Report Chart */}
            <Skeleton className="h-[350px] w-full" /> {/* Monthly Revenue Chart */}
          </div>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3"> {/* Pie charts and Agent List */}
            <Skeleton className="h-[350px] w-full" /> {/* Invoice Status Pie */}
            <Skeleton className="h-[350px] w-full" /> {/* Sales by Yacht Pie */}
            <Skeleton className="h-[350px] w-full" /> {/* Agent List */}
          </div>
          <div className="grid gap-6 lg:grid-cols-1"> {/* Agent Bar Chart */}
            <Skeleton className="h-[350px] w-full" />
          </div>
          <Skeleton className="h-[200px] w-full" /> {/* Latest Invoices */}
        </div>
      </div>
    );
  }

  if (error && leads.length === 0 && yachts.length === 0 && agents.length === 0 && invoices.length === 0) { 
     return (
      <div className="container mx-auto py-2">
        <PageHeader title="Dashboard" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load dashboard data: {error}</p>
      </div>
    );
  }

  const commonErrorLeads = error && leads.length === 0 ? error : null;
  const commonErrorInvoices = error && invoices.length === 0 ? error : null;
  const commonErrorYachts = error && yachts.length === 0 ? error : null;
  const commonErrorAgents = error && agents.length === 0 ? error : null;

  return (
    <div className="container mx-auto py-2">
      <PageHeader title="Dashboard" description="Welcome to DutchOriental CRM. Here's an overview of your yacht business." />
      
      <div className="grid gap-6">
        <PerformanceSummary leads={leads} invoices={invoices} isLoading={isLoading} error={error} />
        <RevenueSummary leads={leads} isLoading={isLoading} error={commonErrorLeads} />
        
        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
            <BookingReportChart leads={leads} isLoading={isLoading} error={commonErrorLeads}/>
            <MonthlyRevenueChart leads={leads} isLoading={isLoading} error={commonErrorLeads} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <InvoiceStatusPieChart invoices={invoices} isLoading={isLoading} error={commonErrorInvoices} />
          <SalesByYachtPieChart leads={leads} allYachts={yachts} isLoading={isLoading} error={error && (leads.length === 0 || yachts.length === 0) ? error : null} />
          <BookedAgentsList leads={leads} allAgents={agents} isLoading={isLoading} error={error && (leads.length === 0 || agents.length === 0) ? error : null} />
        </div>
        
        <div className="grid-cols-1"> {/* Bar chart takes full width */}
          <BookingsByAgentBarChart leads={leads} allAgents={agents} isLoading={isLoading} error={error && (leads.length === 0 || agents.length === 0) ? error : null} />
        </div>
        
        <LatestInvoicesTable invoices={invoices} isLoading={isLoading} error={commonErrorInvoices} />
      </div>
    </div>
  );
}
