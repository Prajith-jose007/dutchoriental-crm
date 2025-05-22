
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { Yacht } from '@/lib/types';
import { useEffect } from 'react';

const yachtFormSchema = z.object({
  id: z.string().min(1, 'Yacht ID is required'),
  name: z.string().min(2, 'Yacht name must be at least 2 characters'),
  imageUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  status: z.enum(['Available', 'Booked', 'Maintenance']),
  dhowChild89_rate: z.coerce.number().min(0).optional().default(0),
  dhowFood99_rate: z.coerce.number().min(0).optional().default(0),
  dhowDrinks199_rate: z.coerce.number().min(0).optional().default(0),
  dhowVip299_rate: z.coerce.number().min(0).optional().default(0),
  oeChild129_rate: z.coerce.number().min(0).optional().default(0),
  oeFood149_rate: z.coerce.number().min(0).optional().default(0),
  oeDrinks249_rate: z.coerce.number().min(0).optional().default(0),
  oeVip349_rate: z.coerce.number().min(0).optional().default(0),
  sunsetChild179_rate: z.coerce.number().min(0).optional().default(0),
  sunsetFood199_rate: z.coerce.number().min(0).optional().default(0),
  sunsetDrinks299_rate: z.coerce.number().min(0).optional().default(0),
  lotusFood249_rate: z.coerce.number().min(0).optional().default(0),
  lotusDrinks349_rate: z.coerce.number().min(0).optional().default(0),
  lotusVip399_rate: z.coerce.number().min(0).optional().default(0),
  lotusVip499_rate: z.coerce.number().min(0).optional().default(0),
  othersAmtCake_rate: z.coerce.number().min(0).optional().default(0),
});

export type YachtFormData = z.infer<typeof yachtFormSchema>;

interface YachtFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  yacht?: Yacht | null;
  onSubmitSuccess: (data: Yacht) => void;
}

const statusOptions: Yacht['status'][] = ['Available', 'Booked', 'Maintenance'];

const packageRateFields: { name: keyof YachtFormData; label: string; packageType: string }[] = [
  { name: 'dhowChild89_rate', label: 'Dhow Child (89 AED)', packageType: 'DHOW' },
  { name: 'dhowFood99_rate', label: 'Dhow Food (99 AED)', packageType: 'DHOW' },
  { name: 'dhowDrinks199_rate', label: 'Dhow Drinks (199 AED)', packageType: 'DHOW' },
  { name: 'dhowVip299_rate', label: 'Dhow VIP (299 AED)', packageType: 'DHOW' },
  { name: 'oeChild129_rate', label: 'OE Child (129 AED)', packageType: 'OE' },
  { name: 'oeFood149_rate', label: 'OE Food (149 AED)', packageType: 'OE' },
  { name: 'oeDrinks249_rate', label: 'OE Drinks (249 AED)', packageType: 'OE' },
  { name: 'oeVip349_rate', label: 'OE VIP (349 AED)', packageType: 'OE' },
  { name: 'sunsetChild179_rate', label: 'Sunset Child (179 AED)', packageType: 'SUNSET' },
  { name: 'sunsetFood199_rate', label: 'Sunset Food (199 AED)', packageType: 'SUNSET' },
  { name: 'sunsetDrinks299_rate', label: 'Sunset Drinks (299 AED)', packageType: 'SUNSET' },
  { name: 'lotusFood249_rate', label: 'Lotus Food (249 AED)', packageType: 'LOTUS' },
  { name: 'lotusDrinks349_rate', label: 'Lotus Drinks (349 AED)', packageType: 'LOTUS' },
  { name: 'lotusVip399_rate', label: 'Lotus VIP (399 AED)', packageType: 'LOTUS' },
  { name: 'lotusVip499_rate', label: 'Lotus VIP (499 AED)', packageType: 'LOTUS' },
  { name: 'othersAmtCake_rate', label: 'Others/Cake Rate (AED)', packageType: 'OTHER' },
];


export function YachtFormDialog({ isOpen, onOpenChange, yacht, onSubmitSuccess }: YachtFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<YachtFormData>({
    resolver: zodResolver(yachtFormSchema),
    defaultValues: yacht || {
      id: '',
      name: '',
      imageUrl: '',
      capacity: 50,
      status: 'Available',
      dhowChild89_rate: 0,
      dhowFood99_rate: 0,
      dhowDrinks199_rate: 0,
      dhowVip299_rate: 0,
      oeChild129_rate: 0,
      oeFood149_rate: 0,
      oeDrinks249_rate: 0,
      oeVip349_rate: 0,
      sunsetChild179_rate: 0,
      sunsetFood199_rate: 0,
      sunsetDrinks299_rate: 0,
      lotusFood249_rate: 0,
      lotusDrinks349_rate: 0,
      lotusVip399_rate: 0,
      lotusVip499_rate: 0,
      othersAmtCake_rate: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (yacht) {
        form.reset({
          ...yacht,
          imageUrl: yacht.imageUrl || '',
        });
      } else {
        form.reset({
          id: '', 
          name: '',
          imageUrl: '',
          capacity: 50,
          status: 'Available',
          dhowChild89_rate: 0,
          dhowFood99_rate: 0,
          dhowDrinks199_rate: 0,
          dhowVip299_rate: 0,
          oeChild129_rate: 0,
          oeFood149_rate: 0,
          oeDrinks249_rate: 0,
          oeVip349_rate: 0,
          sunsetChild179_rate: 0,
          sunsetFood199_rate: 0,
          sunsetDrinks299_rate: 0,
          lotusFood249_rate: 0,
          lotusDrinks349_rate: 0,
          lotusVip399_rate: 0,
          lotusVip499_rate: 0,
          othersAmtCake_rate: 0,
        });
      }
    }
  }, [yacht, form, isOpen]);

  function onSubmit(data: YachtFormData) {
    const submittedYacht: Yacht = {
      ...data,
      imageUrl: data.imageUrl || undefined,
    };
    onSubmitSuccess(submittedYacht);
    toast({
      title: yacht ? 'Yacht Updated' : 'Yacht Added',
      description: `${data.name} has been ${yacht ? 'updated' : 'added'}.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{yacht ? 'Edit Yacht' : 'Add New Yacht'}</DialogTitle>
          <DialogDescription>
            {yacht ? 'Update the details for this yacht.' : 'Fill in the details for the new yacht.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yacht ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., YACHT001" 
                          {...field} 
                          readOnly={!!yacht} 
                          className={!!yacht ? "bg-muted/50" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yacht Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Sea Serpent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://placehold.co/300x200.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity (Guests)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <h3 className="text-lg font-medium pt-4 border-t mt-6">Package Rates (AED)</h3>
              
              {(['DHOW', 'OE', 'SUNSET', 'LOTUS', 'OTHER'] as const).map(packageGroup => (
                <div key={packageGroup}>
                  <h4 className="text-md font-medium mt-4 mb-2">{packageGroup} Package Rates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageRateFields.filter(f => f.packageType === packageGroup).map(rateField => (
                      <FormField
                        key={rateField.name}
                        control={form.control}
                        name={rateField.name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{rateField.label}</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <DialogFooter className="pt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{yacht ? 'Save Changes' : 'Add Yacht'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
