
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { PerformanceSummary } from './_components/PerformanceSummary';
import type { Lead } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname(); // Get the current path
  const [leads, setLeads] = useState<Lead[]>([]);
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
    // Don't fetch data until authentication check is complete
    if (isAuthLoading) return; 

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [leadsRes] = await Promise.all([
          fetch('/api/leads'),
        ]);

        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        
        const leadsData = await leadsRes.json();
        
        setLeads(Array.isArray(leadsData) ? leadsData : []);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError((err as Error).message);
        setLeads([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch data whenever the dashboard page is active (pathname changes to /dashboard)
    if (pathname === '/dashboard') {
      fetchData();
    }
  }, [isAuthLoading, pathname]); // Re-run fetch when pathname changes
  
  if (isAuthLoading || (isLoading && leads.length === 0)) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Dashboard" description="Loading data..." />
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_,i) => <Skeleton key={`crm-stat-${i}`} className="h-[120px] w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error && leads.length === 0) { 
     return (
      <div className="container mx-auto py-2">
        <PageHeader title="CRM Dashboard" description="Error loading data." />
        <p className="text-destructive text-center py-10">Failed to load dashboard data: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader title="CRM Dashboard" description="At-a-glance view of your sales pipeline." />
      
      <div className="grid gap-6">
        <PerformanceSummary leads={leads} isLoading={isLoading} error={error} />
        {/* Other CRM components can be added here in the future */}
      </div>
    </div>
  );
}
