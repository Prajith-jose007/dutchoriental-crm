
'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportExportButtonsProps {
  onAddLeadClick: () => void;
  onCsvImport: (file: File) => void;
}

export function ImportExportButtons({ onAddLeadClick, onCsvImport }: ImportExportButtonsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv') {
        onCsvImport(file);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
      }
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = () => {
    toast({ title: 'Export Initiated', description: 'CSV export feature is not yet implemented.' });
  };
  
  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button variant="outline" onClick={handleImportClick}>
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
