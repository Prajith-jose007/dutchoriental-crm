'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: (date: Date) => boolean;
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className, disabled, fromYear, toYear, ...props }: DatePickerProps & { fromYear?: number; toYear?: number; [key: string]: any }) {
  const [open, setOpen] = React.useState(false);
  const defaultFromYear = fromYear ?? 2022;
  const defaultToYear = toYear ?? 2030;

  return (
    <Popover modal={true} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[9999] pointer-events-auto" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            setDate(newDate);
            if (newDate) {
              setOpen(false);
            }
          }}
          initialFocus
          disabled={disabled}
          captionLayout="dropdown"
          fromYear={defaultFromYear}
          toYear={defaultToYear}
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}
