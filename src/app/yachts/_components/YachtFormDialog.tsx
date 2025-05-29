
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form'; // Removed useFieldArray
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
import { Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema for the 9 fixed package rates + otherCharge
const yachtFormSchema = z.object({
  id: z.string().min(1, 'Yacht ID is required'),
  name: z.string().min(2, 'Yacht name must be at least 2 characters'),
  imageUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  status: z.enum(['Available', 'Booked', 'Maintenance']),
  customPackageInfo: z.string().optional(),

  // Standardized 9 Package Rates
  childRate: z.coerce.number().min(0).optional().default(0),
  adultStandardRate: z.coerce.number().min(0).optional().default(0),
  adultStandardDrinksRate: z.coerce.number().min(0).optional().default(0),
  vipChildRate: z.coerce.number().min(0).optional().default(0),
  vipAdultRate: z.coerce.number().min(0).optional().default(0),
  vipAdultDrinksRate: z.coerce.number().min(0).optional().default(0),
  royalChildRate: z.coerce.number().min(0).optional().default(0),
  royalAdultRate: z.coerce.number().min(0).optional().default(0),
  royalDrinksRate: z.coerce.number().min(0).optional().default(0),

  // Custom Other Charge
  otherChargeName: z.string().optional(),
  otherChargeRate: z.coerce.number().min(0).optional().default(0),
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

// Configuration for the 9 fixed rate fields
const fixedRateFieldConfigs = [
  { name: 'childRate' as keyof YachtFormData, label: 'Child Package Rate (AED)' },
  { name: 'adultStandardRate' as keyof YachtFormData, label: 'Adult Standard Rate (AED)' },
  { name: 'adultStandardDrinksRate' as keyof YachtFormData, label: 'Adult Standard + Drinks Rate (AED)' },
  { name: 'vipChildRate' as keyof YachtFormData, label: 'VIP Child Rate (AED)' },
  { name: 'vipAdultRate' as keyof YachtFormData, label: 'VIP Adult Rate (AED)' },
  { name: 'vipAdultDrinksRate' as keyof YachtFormData, label: 'VIP Adult + Drinks Rate (AED)' },
  { name: 'royalChildRate' as keyof YachtFormData, label: 'Royal Child Rate (AED)' },
  { name: 'royalAdultRate' as keyof YachtFormData, label: 'Royal Adult Rate (AED)' },
  { name: 'royalDrinksRate' as keyof YachtFormData, label: 'Royal Adult + Drinks Rate (AED)' },
];


const getDefaultYachtFormValues = (): YachtFormData => ({
  id: '',
  name: '',
  imageUrl: '',
  capacity: 50,
  status: 'Available',
  customPackageInfo: '',
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
});


export function YachtFormDialog({ isOpen, onOpenChange, yacht, onSubmitSuccess, isAdmin }: YachtFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<YachtFormData>({
    resolver: zodResolver(yachtFormSchema),
    defaultValues: getDefaultYachtFormValues(),
  });


  useEffect(() => {
    if (isOpen) {
      const defaultValues = getDefaultYachtFormValues();
      if (yacht) {
        form.reset({
          ...defaultValues, // Start with defaults
          ...yacht,        // Overlay existing yacht data
          imageUrl: yacht.imageUrl || '',
          customPackageInfo: yacht.customPackageInfo || '',
          // Ensure all fixed rates are present, defaulting to 0 if not on yacht object
          childRate: yacht.childRate || 0,
          adultStandardRate: yacht.adultStandardRate || 0,
          adultStandardDrinksRate: yacht.adultStandardDrinksRate || 0,
          vipChildRate: yacht.vipChildRate || 0,
          vipAdultRate: yacht.vipAdultRate || 0,
          vipAdultDrinksRate: yacht.vipAdultDrinksRate || 0,
          royalChildRate: yacht.royalChildRate || 0,
          royalAdultRate: yacht.royalAdultRate || 0,
          royalDrinksRate: yacht.royalDrinksRate || 0,
          otherChargeName: yacht.otherChargeName || '',
          otherChargeRate: yacht.otherChargeRate || 0,
        } as YachtFormData);
      } else {
        form.reset(defaultValues);
      }
    }
  }, [yacht, form, isOpen]);

  function onSubmit(data: YachtFormData) {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can save yacht data.", variant: "destructive"});
      onOpenChange(false);
      return;
    }

    const submittedYacht: Yacht = {
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
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[900px]">
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
                          onChange={e => field.onChange(parseInt(e.target.value,10) || 0)}
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

              <h3 className="text-lg font-medium pt-4 border-t mt-6">Standard Package Rates</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fixedRateFieldConfigs.map(rateField => (
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
                            placeholder="0.00"
                            {...field}
                            value={field.value || 0}
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
                            placeholder="e.g., Cake Service, DJ Setup"
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
                            placeholder="0.00"
                            {...field}
                            value={field.value || 0}
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
                  <FormItem className="pt-4 border-t mt-6">
                    <FormLabel>Additional Custom Package Info/Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any general custom package details or notes here..."
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
