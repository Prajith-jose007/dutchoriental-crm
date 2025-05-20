
'use client';

import { Button } from '@/components/ui/button';
import { Upload, Download, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportExportButtonsProps {
  onAddLeadClick: () => void;
}

export function ImportExportButtons({ onAddLeadClick }: ImportExportButtonsProps) {
  const { toast } = useToast();

  const handleImport = () => {
    toast({ title: 'Import Initiated', description: 'CSV import feature is not yet implemented.' });
  };

  const handleExport = () => {
    toast({ title: 'Export Initiated', description: 'CSV export feature is not yet implemented.' });
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={handleImport}>
        <Upload className="mr-2 h-4 w-4" />
        Import CSV
      </Button>
      <Button variant="outline" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
      <Button onClick={onAddLeadClick}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Lead
      </Button>
    </div>
  );
}
