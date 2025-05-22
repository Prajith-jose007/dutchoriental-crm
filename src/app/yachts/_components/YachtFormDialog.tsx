
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

  // DHOW Rates
  dhowChildRate: z.coerce.number().min(0).optional().default(0),
  dhowAdultRate: z.coerce.number().min(0).optional().default(0),
  dhowVipRate: z.coerce.number().min(0).optional().default(0),
  dhowVipChildRate: z.coerce.number().min(0).optional().default(0),
  dhowVipAlcoholRate: z.coerce.number().min(0).optional().default(0),

  // OE Rates
  oeChildRate: z.coerce.number().min(0).optional().default(0),
  oeAdultRate: z.coerce.number().min(0).optional().default(0),
  oeVipRate: z.coerce.number().min(0).optional().default(0),
  oeVipChildRate: z.coerce.number().min(0).optional().default(0),
  oeVipAlcoholRate: z.coerce.number().min(0).optional().default(0),

  // SUNSET Rates
  sunsetChildRate: z.coerce.number().min(0).optional().default(0),
  sunsetAdultRate: z.coerce.number().min(0).optional().default(0),
  sunsetVipRate: z.coerce.number().min(0).optional().default(0),
  sunsetVipChildRate: z.coerce.number().min(0).optional().default(0),
  sunsetVipAlcoholRate: z.coerce.number().min(0).optional().default(0),
  
  // LOTUS Rates
  lotusChildRate: z.coerce.number().min(0).optional().default(0),
  lotusAdultRate: z.coerce.number().min(0).optional().default(0),
  lotusVipRate: z.coerce.number().min(0).optional().default(0),
  lotusVipChildRate: z.coerce.number().min(0).optional().default(0),
  lotusVipAlcoholRate: z.coerce.number().min(0).optional().default(0),

  // Royal Rate
  royalRate: z.coerce.number().min(0).optional().default(0),
  
  othersAmtCake_rate: z.coerce.number().min(0).optional().default(0), // Kept for now
});

export type YachtFormData = z.infer<typeof yachtFormSchema>;

interface YachtFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  yacht?: Yacht | null;
  onSubmitSuccess: (data: Yacht) => void;
}

const statusOptions: Yacht['status'][] = ['Available', 'Booked', 'Maintenance'];

interface PackageRateFieldConfig {
  name: keyof YachtFormData; 
  label: string; 
  category: 'DHOW' | 'OE' | 'SUNSET' | 'LOTUS' | 'ROYAL' | 'OTHER';
}

const packageRateFields: PackageRateFieldConfig[] = [
  // DHOW
  { name: 'dhowChildRate', label: 'DHOW - Child Rate (AED)', category: 'DHOW' },
  { name: 'dhowAdultRate', label: 'DHOW - Adult Rate (AED)', category: 'DHOW' },
  { name: 'dhowVipRate', label: 'DHOW - VIP Rate (AED)', category: 'DHOW' },
  { name: 'dhowVipChildRate', label: 'DHOW - VIP Child Rate (AED)', category: 'DHOW' },
  { name: 'dhowVipAlcoholRate', label: 'DHOW - VIP Alcohol Rate (AED)', category: 'DHOW' },
  // OE
  { name: 'oeChildRate', label: 'OE - Child Rate (AED)', category: 'OE' },
  { name: 'oeAdultRate', label: 'OE - Adult Rate (AED)', category: 'OE' },
  { name: 'oeVipRate', label: 'OE - VIP Rate (AED)', category: 'OE' },
  { name: 'oeVipChildRate', label: 'OE - VIP Child Rate (AED)', category: 'OE' },
  { name: 'oeVipAlcoholRate', label: 'OE - VIP Alcohol Rate (AED)', category: 'OE' },
  // SUNSET
  { name: 'sunsetChildRate', label: 'SUNSET - Child Rate (AED)', category: 'SUNSET' },
  { name: 'sunsetAdultRate', label: 'SUNSET - Adult Rate (AED)', category: 'SUNSET' },
  { name: 'sunsetVipRate', label: 'SUNSET - VIP Rate (AED)', category: 'SUNSET' },
  { name: 'sunsetVipChildRate', label: 'SUNSET - VIP Child Rate (AED)', category: 'SUNSET' },
  { name: 'sunsetVipAlcoholRate', label: 'SUNSET - VIP Alcohol Rate (AED)', category: 'SUNSET' },
  // LOTUS
  { name: 'lotusChildRate', label: 'LOTUS - Child Rate (AED)', category: 'LOTUS' },
  { name: 'lotusAdultRate', label: 'LOTUS - Adult Rate (AED)', category: 'LOTUS' },
  { name: 'lotusVipRate', label: 'LOTUS - VIP Rate (AED)', category: 'LOTUS' },
  { name: 'lotusVipChildRate', label: 'LOTUS - VIP Child Rate (AED)', category: 'LOTUS' },
  { name: 'lotusVipAlcoholRate', label: 'LOTUS - VIP Alcohol Rate (AED)', category: 'LOTUS' },
  // ROYAL
  { name: 'royalRate', label: 'Royal Package Rate (AED)', category: 'ROYAL' },
  // OTHER
  { name: 'othersAmtCake_rate', label: 'Others/Cake Base Rate (AED)', category: 'OTHER' },
];

const getDefaultYachtFormValues = (): YachtFormData => ({
  id: '',
  name: '',
  imageUrl: '',
  capacity: 50,
  status: 'Available',
  dhowChildRate: 0, dhowAdultRate: 0, dhowVipRate: 0, dhowVipChildRate: 0, dhowVipAlcoholRate: 0,
  oeChildRate: 0, oeAdultRate: 0, oeVipRate: 0, oeVipChildRate: 0, oeVipAlcoholRate: 0,
  sunsetChildRate: 0, sunsetAdultRate: 0, sunsetVipRate: 0, sunsetVipChildRate: 0, sunsetVipAlcoholRate: 0,
  lotusChildRate: 0, lotusAdultRate: 0, lotusVipRate: 0, lotusVipChildRate: 0, lotusVipAlcoholRate: 0,
  royalRate: 0,
  othersAmtCake_rate: 0,
});


export function YachtFormDialog({ isOpen, onOpenChange, yacht, onSubmitSuccess }: YachtFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<YachtFormData>({
    resolver: zodResolver(yachtFormSchema),
    defaultValues: yacht ? yacht as YachtFormData : getDefaultYachtFormValues(),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(yacht ? { ...yacht, imageUrl: yacht.imageUrl || '' } as YachtFormData : getDefaultYachtFormValues());
    }
  }, [yacht, form, isOpen]);

  function onSubmit(data: YachtFormData) {
    const submittedYacht: Yacht = {
      ...getDefaultYachtFormValues(),
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
  
  const packageCategories = ['DHOW', 'OE', 'SUNSET', 'LOTUS', 'ROYAL', 'OTHER'] as const;

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
                      <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
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
              
              {packageCategories.map(category => (
                <div key={category}>
                  <h4 className="text-md font-semibold mt-4 mb-2">{category} Package Rates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageRateFields.filter(f => f.category === category).map(rateField => (
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
