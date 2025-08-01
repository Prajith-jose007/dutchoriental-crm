
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import type { Lead, Invoice, Yacht, Agent, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Target, TrendingUp, PieChart, CheckCircle, Activity } from 'lucide-react';
import { MonthlyRevenueChart } from '@/app/dashboard/_components/MonthlyRevenueChart';
import { SalesByYachtPieChart } from '@/app/dashboard/_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from '@/app/dashboard/_components/BookingsByAgentBarChart';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, isValid } from 'date-fns';


const USER_ROLE_STORAGE_KEY = 'currentUserRole';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function SummaryCard({ title, value, description, icon, isLoading }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}


export default function CrmDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Hardcoded Targets ---
  const ANNUAL_TARGET = 500000;
  const MONTHLY_TARGET = 45000;

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
  
  const crmStats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const closedLeads = leads.filter(l => l.status.startsWith('Closed'));
    const balanceLeads = leads.filter(l => l.status === 'Balance');

    const revenueThisMonth = leads.reduce((sum, lead) => {
      if (lead.status === 'Closed (Won)' && lead.month) {
        const eventDate = parseISO(lead.month);
        if (isValid(eventDate) && isWithinInterval(eventDate, { start: currentMonthStart, end: currentMonthEnd })) {
          return sum + (lead.netAmount || 0);
        }
      }
      return sum;
    }, 0);

    const conversionRate = leads.length > 0 ? (closedLeads.length / leads.length) * 100 : 0;

    return {
      monthlyRevenue: revenueThisMonth,
      closedCount: closedLeads.length,
      balanceCount: balanceLeads.length,
      conversionRate: conversionRate.toFixed(1) + '%',
    };
  }, [leads]);
  
  if (isAuthLoading || (isLoading && leads.length === 0)) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Dashboard" description="Loading data..." />
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
             <Skeleton className="h-[120px] w-full" />
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
        {/* --- CRM Metrics Buckets --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
                title="Annual Target"
                value={`${ANNUAL_TARGET.toLocaleString()} AED`}
                icon={<Target className="h-5 w-5 text-muted-foreground" />}
                description="Company-wide revenue goal for the year."
                isLoading={isLoading}
            />
            <SummaryCard
                title="Monthly Target"
                value={`${MONTHLY_TARGET.toLocaleString()} AED`}
                icon={<Target className="h-5 w-5 text-muted-foreground" />}
                description={`Target for ${format(new Date(), 'MMMM yyyy')}.`}
                isLoading={isLoading}
            />
            <SummaryCard
                title="Actual Revenue by Month"
                value={`${crmStats.monthlyRevenue.toLocaleString()} AED`}
                icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
                description="Revenue from deals won this month."
                isLoading={isLoading}
            />
            <SummaryCard
                title="Deal Status Distribution"
                value={`${crmStats.balanceCount} / ${crmStats.closedCount}`}
                icon={<PieChart className="h-5 w-5 text-muted-foreground" />}
                description="Balance / Closed"
                isLoading={isLoading}
            />
            <SummaryCard
                title="Pipeline Conversion"
                value={crmStats.conversionRate}
                icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
                description="% of leads that are 'Closed'."
                isLoading={isLoading}
            />
        </div>

        {/* --- Visual Charts --- */}
        <div className="grid gap-6 md:grid-cols-2 mt-4">
            <MonthlyRevenueChart leads={leads} isLoading={isLoading} error={error}/>
            <SalesByYachtPieChart leads={leads} allYachts={yachts} isLoading={isLoading} error={error} />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-1 mt-4">
           <BookingsByAgentBarChart leads={leads} allAgents={agents} isLoading={isLoading} error={error} />
        </div>

      </div>
    </div>
  );
}
