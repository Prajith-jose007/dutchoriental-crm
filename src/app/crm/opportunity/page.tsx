
'use client';

import { PageHeader } from '@/components/PageHeader';

export default function OpportunityPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Opportunity Management"
        description="This is the page for managing sales opportunities."
      />
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <p className="text-lg text-muted-foreground">
          Opportunity content will be displayed here.
        </p>
      </div>
    </div>
  );
}
