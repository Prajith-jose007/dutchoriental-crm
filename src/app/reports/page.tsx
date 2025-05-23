
'use client';

import { PageHeader } from '@/components/PageHeader';
import { BookingReportChart } from '../dashboard/_components/BookingReportChart';
import { InvoiceStatusPieChart } from '../dashboard/_components/InvoiceStatusPieChart';
import { SalesByYachtPieChart } from '../dashboard/_components/SalesByYachtPieChart';
import { BookingsByAgentBarChart } from '../dashboard/_components/BookingsByAgentBarChart';

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="CRM Reports" 
        description="A consolidated view of key metrics and performance indicators." 
      />
      
      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-1"> {/* Full width for booking report */}
          <BookingReportChart />
        </div>

        <div className="grid gap-6 md:grid-cols-2"> {/* Two columns for these pie charts */}
          <InvoiceStatusPieChart />
          <SalesByYachtPieChart />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-1"> {/* Full width for agent bookings */}
          <BookingsByAgentBarChart />
        </div>
      </div>
    </div>
  );
}
