import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from './_components/BookingReportChart';
import { RevenueSummary } from './_components/RevenueSummary';
import { YachtList } from './_components/YachtList';
import { LatestInvoicesTable } from './_components/LatestInvoicesTable';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader title="Dashboard" description="Welcome to AquaLeads CRM. Here's an overview of your yacht business." />
      
      <div className="grid gap-6">
        <RevenueSummary />
        
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BookingReportChart />
          </div>
          <div className="lg:col-span-1">
            <YachtList />
          </div>
        </div>
        
        <LatestInvoicesTable />
      </div>
    </div>
  );
}
