
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
import { Textarea } from '@/components/ui/textarea';
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

  // Standardized package rates
  childRate: z.coerce.number().min(0).optional().default(0),
  adultStandardRate: z.coerce.number().min(0).optional().default(0),
  adultStandardDrinksRate: z.coerce.number().min(0).optional().default(0),
  vipChildRate: z.coerce.number().min(0).optional().default(0),
  vipAdultRate: z.coerce.number().min(0).optional().default(0),
  vipAdultDrinksRate: z.coerce.number().min(0).optional().default(0),
  royalChildRate: z.coerce.number().min(0).optional().default(0),
  royalAdultRate: z.coerce.number().min(0).optional().default(0),
  royalDrinksRate: z.coerce.number().min(0).optional().default(0),
  
  otherChargeName: z.string().optional(),
  otherChargeRate: z.coerce.number().min(0).optional().default(0),
  customPackageInfo: z.string().optional(),
});

export type YachtFormData = z.infer<typeof yachtFormSchema>;

interface YachtFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  yacht?: Yacht | null;
  onSubmitSuccess: (data: Yacht) => void;
  isAdmin: boolean; 
}

const statusOptions: Yacht['status'][] = ['Available', 'Booked', 'Maintenance'];

const rateFieldsConfig: { name: keyof YachtFormData; label: string }[] = [
    { name: 'childRate', label: 'Child Rate (AED)' },
    { name: 'adultStandardRate', label: 'Adults Standard Rate (AED)' },
    { name: 'adultStandardDrinksRate', label: 'Adults Standard Drinks Rate (AED)' },
    { name: 'vipChildRate', label: 'VIP Child Rate (AED)' },
    { name: 'vipAdultRate', label: 'VIP Adult Rate (AED)' },
    { name: 'vipAdultDrinksRate', label: 'VIP Adult Drinks Rate (AED)' },
    { name: 'royalChildRate', label: 'Royal Child Rate (AED)' },
    { name: 'royalAdultRate', label: 'Royal Adult Rate (AED)' },
    { name: 'royalDrinksRate', label: 'Royal Drinks Rate (AED)' },
];


const getDefaultYachtFormValues = (): YachtFormData => ({
  id: '',
  name: '',
  imageUrl: '',
  capacity: 50,
  status: 'Available',
  childRate: 0,
  adultStandardRate: 0,
  adultStandardDrinksRate: 0,
  vipChildRate: 0,
  vipAdultRate: 0,
  vipAdultDrinksRate: 0,
  royalChildRate: 0,
  royalAdultRate: 0,
  royalDrinksRate: 0,
  otherChargeName: '',
  otherChargeRate: 0,
  customPackageInfo: '',
});


export function YachtFormDialog({ isOpen, onOpenChange, yacht, onSubmitSuccess, isAdmin }: YachtFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<YachtFormData>({
    resolver: zodResolver(yachtFormSchema),
    defaultValues: yacht 
      ? { ...getDefaultYachtFormValues(), ...yacht, 
          imageUrl: yacht.imageUrl || '',
          customPackageInfo: yacht.customPackageInfo || '',
          otherChargeName: yacht.otherChargeName || '',
        } 
      : getDefaultYachtFormValues(),
  });

  useEffect(() => {
    if (isOpen) {
      const defaultValues = getDefaultYachtFormValues();
      const currentYachtValues = yacht 
        ? {
            ...defaultValues,
            ...yacht,
            imageUrl: yacht.imageUrl || '',
            customPackageInfo: yacht.customPackageInfo || '',
            otherChargeName: yacht.otherChargeName || '',
          }
        : defaultValues;
      form.reset(currentYachtValues as YachtFormData);
    }
  }, [yacht, form, isOpen]);

  function onSubmit(data: YachtFormData) {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can save yacht data.", variant: "destructive"});
      onOpenChange(false); // Close dialog for non-admins without submitting
      return;
    }
    const submittedYacht: Yacht = {
      ...getDefaultYachtFormValues(), 
      ...data,
      imageUrl: data.imageUrl || undefined,
      customPackageInfo: data.customPackageInfo || undefined,
      otherChargeName: data.otherChargeName || undefined,
    };
    onSubmitSuccess(submittedYacht);
    onOpenChange(false);
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{isAdmin ? (yacht ? 'Edit Yacht' : 'Add New Yacht') : 'View Yacht Details'}</DialogTitle>
          <DialogDescription>
            {isAdmin ? (yacht ? 'Update the details for this yacht.' : 'Fill in the details for the new yacht.') : 'Viewing yacht information. Editing is restricted to administrators.'}
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
                          readOnly={!!yacht || !isAdmin} 
                          className={(!!yacht || !isAdmin) ? "bg-muted/50 cursor-not-allowed" : ""}
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
                        <Input 
                          placeholder="e.g., The Sea Serpent" 
                          {...field} 
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                        />
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
                        <Input 
                          placeholder="https://placehold.co/300x200.png" 
                          {...field} 
                          value={field.value || ''} 
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                        />
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
                        <Input 
                          type="number" 
                          placeholder="50" 
                          {...field} 
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                        />
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
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || undefined} 
                        defaultValue={field.value}
                        disabled={!isAdmin}
                      >
                        <FormControl>
                          <SelectTrigger className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rateFieldsConfig.map(rateField => (
                  <FormField
                    key={rateField.name}
                    control={form.control}
                    name={rateField.name}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{rateField.label}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field} 
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                            readOnly={!isAdmin}
                            className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <h3 className="text-lg font-medium pt-4 border-t mt-6">Custom Other Charge</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="otherChargeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Charge Name (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., DJ Services" 
                          {...field} 
                          value={field.value || ''}
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherChargeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Charge Rate (AED)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="0" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          readOnly={!isAdmin}
                          className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="customPackageInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Package Info/Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any custom package details or notes here..." 
                        className={cn("resize-y", !isAdmin && "bg-muted/50 cursor-not-allowed")}
                        {...field} 
                        value={field.value || ''}
                        readOnly={!isAdmin}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <DialogFooter className="pt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                {isAdmin && (
                  <Button type="submit">{yacht ? 'Save Changes' : 'Add Yacht'}</Button>
                )}
                 {!isAdmin && yacht && ( 
                    <Button type="button" disabled>View Only</Button> 
                 )}
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
