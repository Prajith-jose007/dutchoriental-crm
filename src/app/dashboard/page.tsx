
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ManagementKPIs } from './_components/ManagementKPIs';
import { SalesFunnelWidget } from './_components/SalesFunnelWidget';
import { YachtUtilizationWidget } from './_components/YachtUtilizationWidget';
import { CheckInsTodayWidget } from './_components/CheckInsTodayWidget';
import { InvoiceStatusPieChart } from './_components/InvoiceStatusPieChart';
import { SalesByYachtPieChart } from './_components/SalesByYachtPieChart';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      console.error("Error accessing localStorage:", e);
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
        const [leadsRes, invoicesRes, yachtsRes, agentsRes] = await Promise.all([
          fetch('/api/leads'),
          fetch('/api/invoices'),
          fetch('/api/yachts'),
          fetch('/api/agents'),
        ]);

        if (!leadsRes.ok || !invoicesRes.ok || !yachtsRes.ok || !agentsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [leadsData, invoicesData, yachtsData, agentsData] = await Promise.all([
          leadsRes.json(), invoicesRes.json(), yachtsRes.json(), agentsRes.json()
        ]);

        setAllLeads(Array.isArray(leadsData) ? leadsData : []);
        setAllInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setAllYachts(Array.isArray(yachtsData) ? yachtsData : []);
        setAllAgents(Array.isArray(agentsData) ? agentsData : []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isAuthLoading]);

  if (isAuthLoading || (isLoading && allLeads.length === 0)) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px]" />
          <Skeleton className="col-span-3 h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Management Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive real-time view of your fleet and booking performance.</p>
        </div>
      </div>

      <ManagementKPIs leads={allLeads} isLoading={isLoading} />

      <Tabs defaultValue="overview" className="space-y-6 mt-8">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview">Executive Overview</TabsTrigger>
          <TabsTrigger value="operations">Operational View</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-7 lg:col-span-8">
              <SalesFunnelWidget leads={allLeads} />
            </div>
            <div className="md:col-span-5 lg:col-span-4">
              <InvoiceStatusPieChart invoices={allInvoices} isLoading={isLoading} />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-6 lg:col-span-6">
              <SalesByYachtPieChart leads={allLeads} allYachts={allYachts} isLoading={isLoading} />
            </div>
            <div className="md:col-span-6 lg:col-span-6">
              <YachtUtilizationWidget leads={allLeads} yachts={allYachts} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-5">
              <CheckInsTodayWidget leads={allLeads} yachts={allYachts} />
            </div>
            <div className="md:col-span-7">
              <YachtUtilizationWidget leads={allLeads} yachts={allYachts} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Add a more detailed revenue chart here later if needed */}
          <div className="grid gap-6 md:grid-cols-2">
            <SalesByYachtPieChart leads={allLeads} allYachts={allYachts} isLoading={isLoading} />
            <InvoiceStatusPieChart invoices={allInvoices} isLoading={isLoading} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
