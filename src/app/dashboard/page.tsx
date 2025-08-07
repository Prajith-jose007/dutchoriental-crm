
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { RevenueSummary } from './_components/RevenueSummary';
import { BookingReportChart } from './_components/BookingReportChart';
import { InvoiceStatusPieChart } from './_components/InvoiceStatusPieChart';
import { SalesByYachtPieChart } from './_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from './_components/BookingsByAgentBarChart';
import { BookedAgentsList } from './_components/BookedAgentsList';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent, User } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export default function DashboardPage() {
  const router = useRouter();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allYachts, setAllYachts] = useState<Yacht[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
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
        
        setAllLeads(Array.isArray(leadsData) ? leadsData : []);
        setAllInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError((err as Error).message);
        setAllLeads([]);
        setAllInvoices([]);
        setAllYachts([]);
        setAllAgents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthLoading]);

  const { privateLeads, sharedLeads, privateInvoices, sharedInvoices } = useMemo(() => {
    const privateLeads = allLeads.filter(lead => lead.type === 'Private Cruise');
    const sharedLeads = allLeads.filter(lead => lead.type !== 'Private Cruise');
    
    const privateLeadIds = new Set(privateLeads.map(l => l.id));
    const sharedLeadIds = new Set(sharedLeads.map(l => l.id));

    const privateInvoices = allInvoices.filter(inv => privateLeadIds.has(inv.leadId));
    const sharedInvoices = allInvoices.filter(inv => sharedLeadIds.has(inv.leadId));

    return { privateLeads, sharedLeads, privateInvoices, sharedInvoices };
  }, [allLeads, allInvoices]);
  
  if (isAuthLoading || (isLoading && allLeads.length === 0)) {
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
      <PageHeader title="Overall Dashboard" description="A high-level overview of your CRM's performance across all booking types." />
      
      <div className="space-y-8">
        {/* Private Cruise Section */}
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Private Cruise Dashboard</h2>
            <div className="grid gap-6">
                <RevenueSummary leads={privateLeads} isLoading={isLoading} error={error} />
                <BookingReportChart leads={privateLeads} isLoading={isLoading} error={error} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                   <InvoiceStatusPieChart invoices={privateInvoices} isLoading={isLoading} error={error}/>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                   <div className="lg:col-span-4"><BookingsByAgentBarChart leads={privateLeads} allAgents={allAgents} isLoading={isLoading} error={error} /></div>
                   <div className="lg:col-span-3"><SalesByYachtPieChart leads={privateLeads} allYachts={allYachts} isLoading={isLoading} error={error} /></div>
                </div>
                <BookedAgentsList leads={privateLeads} allAgents={allAgents} isLoading={isLoading} error={error}/>
            </div>
        </div>

        <Separator className="my-8" />

        {/* Shared Cruise Section */}
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Shared Cruise Dashboard</h2>
             <div className="grid gap-6">
                <RevenueSummary leads={sharedLeads} isLoading={isLoading} error={error} />
                <BookingReportChart leads={sharedLeads} isLoading={isLoading} error={error} />
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                   <InvoiceStatusPieChart invoices={sharedInvoices} isLoading={isLoading} error={error}/>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                   <div className="lg:col-span-4"><BookingsByAgentBarChart leads={sharedLeads} allAgents={allAgents} isLoading={isLoading} error={error} /></div>
                   <div className="lg:col-span-3"><SalesByYachtPieChart leads={sharedLeads} allYachts={allYachts} isLoading={isLoading} error={error} /></div>
                </div>
                <BookedAgentsList leads={sharedLeads} allAgents={allAgents} isLoading={isLoading} error={error}/>
            </div>
        </div>
      </div>
    </div>
  );
}
