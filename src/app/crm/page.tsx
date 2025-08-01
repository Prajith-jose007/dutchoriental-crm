
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { RevenueSummary } from '@/app/dashboard/_components/RevenueSummary';
import { PerformanceSummary } from '@/app/dashboard/_components/PerformanceSummary';
import { MonthlyRevenueChart } from '@/app/dashboard/_components/MonthlyRevenueChart';
import { SalesByYachtPieChart } from '@/app/dashboard/_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from '@/app/dashboard/_components/BookingsByAgentBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export default function CrmDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
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
      console.error("Error accessing localStorage for auth check:", e);
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
        const [leadsRes, yachtsRes, agentsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/yachts'),
          fetch('/api/agents'),
        ]);

        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        if (!yachtsRes.ok) throw new Error('Failed to fetch yachts');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        
        const leadsData = await leadsRes.json();
        const yachtsData = await yachtsRes.json();
        const agentsData = await agentsRes.json();
        
        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAgents(Array.isArray(agentsData) ? agentsData : []);

      } catch (err) {
        console.error("Error fetching CRM dashboard data:", err);
        setError((err as Error).message);
        toast({ title: 'Error Fetching Data', description: (err as Error).message, variant: 'destructive' });
        setLeads([]);
        setYachts([]);
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthLoading, toast]);
  
  if (isAuthLoading || (isLoading && leads.length === 0)) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Dashboard" description="Loading data..." />
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
          </div>
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
             <Skeleton className="h-[120px] w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[350px] w-full" />
             <Skeleton className="h-[350px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) { 
     return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Dashboard" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load CRM dashboard data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader title="CRM Dashboard" description="A focused overview of your sales and leads performance." />
      
      <div className="grid gap-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Sales Performance</h2>
        <RevenueSummary leads={leads} isLoading={isLoading} error={error} />
        <div className="grid gap-6 md:grid-cols-2">
            <MonthlyRevenueChart leads={leads} isLoading={isLoading} error={error}/>
            <SalesByYachtPieChart leads={leads} allYachts={yachts} isLoading={isLoading} error={error} />
        </div>
        
        <div className="mt-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Leads Pipeline</h2>
            <PerformanceSummary leads={leads} isLoading={isLoading} error={error}/>
        </div>
        <div className="grid gap-6 lg:grid-cols-1">
           <BookingsByAgentBarChart leads={leads} allAgents={agents} isLoading={isLoading} error={error} />
        </div>

      </div>
    </div>
  );
}
