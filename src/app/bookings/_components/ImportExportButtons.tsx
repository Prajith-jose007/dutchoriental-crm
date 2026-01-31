
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, PlusCircle, ChevronDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export type ImportSource = 'DEFAULT' | 'MASTER' | 'RUZINN' | 'RAYNA' | 'GYG';

interface ImportExportButtonsProps {
  onAddBookingClick: () => void;
  onCsvImport: (file: File, source: ImportSource) => void;
  onCsvExport: () => void;
}

export function ImportExportButtons({ onAddBookingClick, onCsvImport, onCsvExport }: ImportExportButtonsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSource, setSelectedSource] = useState<ImportSource>('DEFAULT');

  const handleImportClick = (source: ImportSource) => {
    setSelectedSource(source);
    // Timeout to allow state update before click (though safely handled in event handler usually, strict React might need ref/effect but this is fine for simple usage)
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        onCsvImport(file, selectedSource);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getImportLabel = (source: ImportSource) => {
    switch (source) {
      case 'MASTER': return 'Master File Import';
      case 'RUZINN': return 'Ruzinn Import';
      case 'RAYNA': return 'Rayna Import';
      case 'GYG': return 'GetYourGuide Import';
      default: return 'Standard Import';
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Upload className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Upload CSV</span>
            <span className="inline sm:hidden">Upload</span>
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleImportClick('MASTER')}>Master File</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImportClick('RUZINN')}>Ruzinn Booking</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImportClick('RAYNA')}>Rayna</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImportClick('GYG')}>Get-Your-Guide</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImportClick('DEFAULT')}>Standard CSV</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/sample_import.csv" download="sample_import.csv" className="w-full cursor-pointer">
              Download Sample CSV
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" onClick={onCsvExport} size="sm" className="h-9">
        <Download className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Download CSV</span>
        <span className="inline sm:hidden">Download</span>
      </Button>
      <Button onClick={onAddBookingClick} size="sm" className="h-9">
        <PlusCircle className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Add Booking</span>
        <span className="inline sm:hidden">Add</span>
      </Button>
    </div>
  );
}
