
'use client';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function OpportunityPage() {
  const handleAddOpportunityClick = () => {
    // Placeholder for opening a new opportunity form/dialog
    console.log('Add New Opportunity clicked');
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Opportunity Management"
        description="This is the page for managing sales opportunities."
        actions={
          <Button onClick={handleAddOpportunityClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Opportunity
          </Button>
        }
      />
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <p className="text-lg text-muted-foreground">
          Opportunity content will be displayed here.
        </p>
      </div>
    </div>
  );
}
