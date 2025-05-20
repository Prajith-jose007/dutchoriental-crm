import { PageHeader } from '@/components/PageHeader';
import { LeadsTable } from './_components/LeadsTable';
import { ImportExportButtons } from './_components/ImportExportButtons';

export default function LeadsPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Leads Management"
        description="Track and manage all your sales leads."
        actions={<ImportExportButtons />}
      />
      <LeadsTable />
    </div>
  );
}
