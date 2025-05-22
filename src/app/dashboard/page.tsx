
import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from './_components/BookingReportChart';
import { RevenueSummary } from './_components/RevenueSummary';
import { PerformanceSummary } from './_components/PerformanceSummary';
import { InvoiceStatusPieChart } from './_components/InvoiceStatusPieChart';
import { LatestInvoicesTable } from './_components/LatestInvoicesTable';
import { SalesByYachtPieChart } from './_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from './_components/BookingsByAgentBarChart';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader title="Dashboard" description="Welcome to DutchOriental CRM. Here's an overview of your yacht business." />
      
      <div className="grid gap-6">
        <RevenueSummary />
        <PerformanceSummary />
        
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <BookingReportChart />
          </div>
          <div className="lg:col-span-1 xl:col-span-2">
            <InvoiceStatusPieChart />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SalesByYachtPieChart />
          </div>
          <div>
            <BookingsByAgentBarChart />
          </div>
        </div>
        
        <LatestInvoicesTable />
      </div>
    </div>
  );
}
