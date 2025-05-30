
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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

const yachtFormSchema = z.object({
  id: z.string().min(1, 'Yacht ID is required'),
  name: z.string().min(2, 'Yacht name must be at least 2 characters'),
  imageUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  status: z.enum(['Available', 'Booked', 'Maintenance']),
  customPackageInfo: z.string().optional(),

  // 9 Standardized Package Rates
  childRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  adultStandardRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  adultStandardDrinksRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  vipChildRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  vipAdultRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  vipAdultDrinksRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  royalChildRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  royalAdultRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
  royalDrinksRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),

  // Custom Other Charge
  otherChargeName: z.string().optional(),
  otherChargeRate: z.coerce.number().min(0, "Rate must be non-negative").optional(),
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

const getDefaultYachtFormValues = (): YachtFormData => ({
  id: '',
  name: '',
  imageUrl: '',
  capacity: 0,
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

// Helper for package rate fields
const packageRateFields: Array<{ name: keyof YachtFormData; label: string }> = [
  { name: 'childRate', label: 'Child Rate' },
  { name: 'adultStandardRate', label: 'Adult Standard Rate' },
  { name: 'adultStandardDrinksRate', label: 'Adult Standard + Drinks Rate' },
  { name: 'vipChildRate', label: 'VIP Child Rate' },
  { name: 'vipAdultRate', label: 'VIP Adult Rate' },
  { name: 'vipAdultDrinksRate', label: 'VIP Adult + Drinks Rate' },
  { name: 'royalChildRate', label: 'Royal Child Rate' },
  { name: 'royalAdultRate', label: 'Royal Adult Rate' },
  { name: 'royalDrinksRate', label: 'Royal Adult + Drinks Rate' },
];


export function YachtFormDialog({ isOpen, onOpenChange, yacht, onSubmitSuccess, isAdmin }: YachtFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<YachtFormData>({
    resolver: zodResolver(yachtFormSchema),
    defaultValues: getDefaultYachtFormValues(),
  });

  useEffect(() => {
    if (isOpen) {
      const defaultVals = getDefaultYachtFormValues();
      if (yacht) {
        form.reset({
          ...defaultVals, // Start with defaults to ensure all fields are present
          ...yacht,
          imageUrl: yacht.imageUrl || '',
          customPackageInfo: yacht.customPackageInfo || '',
          childRate: yacht.childRate ?? 0,
          adultStandardRate: yacht.adultStandardRate ?? 0,
          adultStandardDrinksRate: yacht.adultStandardDrinksRate ?? 0,
          vipChildRate: yacht.vipChildRate ?? 0,
          vipAdultRate: yacht.vipAdultRate ?? 0,
          vipAdultDrinksRate: yacht.vipAdultDrinksRate ?? 0,
          royalChildRate: yacht.royalChildRate ?? 0,
          royalAdultRate: yacht.royalAdultRate ?? 0,
          royalDrinksRate: yacht.royalDrinksRate ?? 0,
          otherChargeName: yacht.otherChargeName || '',
          otherChargeRate: yacht.otherChargeRate ?? 0,
        } as YachtFormData);
      } else {
        form.reset(defaultVals);
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
      childRate: data.childRate ?? 0,
      adultStandardRate: data.adultStandardRate ?? 0,
      adultStandardDrinksRate: data.adultStandardDrinksRate ?? 0,
      vipChildRate: data.vipChildRate ?? 0,
      vipAdultRate: data.vipAdultRate ?? 0,
      vipAdultDrinksRate: data.vipAdultDrinksRate ?? 0,
      royalChildRate: data.royalChildRate ?? 0,
      royalAdultRate: data.royalAdultRate ?? 0,
      royalDrinksRate: data.royalDrinksRate ?? 0,
      otherChargeName: data.otherChargeName || undefined,
      otherChargeRate: data.otherChargeRate ?? 0,
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
              {/* Basic Yacht Details */}
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
                          placeholder="0"
                          min="0"
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

              {/* Fixed Package Rates Section */}
              <div className="pt-4 border-t mt-6">
                <h3 className="text-lg font-medium mb-2">Standard Package Rates (AED)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packageRateFields.map(pkg => (
                    <FormField
                      key={pkg.name}
                      control={form.control}
                      name={pkg.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{pkg.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0.00"
                              {...field}
                              readOnly={!isAdmin}
                              className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                              onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Other Charge Section */}
              <div className="pt-4 border-t mt-6">
                <h3 className="text-lg font-medium mb-2">Custom Other Charge</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="otherChargeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Charge Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Cake Setup Fee"
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
                        <FormLabel>Charge Rate (AED)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            readOnly={!isAdmin}
                            className={!isAdmin ? "bg-muted/50 cursor-not-allowed" : ""}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="customPackageInfo"
                render={({ field }) => (
                  <FormItem className="pt-4 border-t mt-6">
                    <FormLabel>Additional Custom Package Info/Notes (Optional)</FormLabel>
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
                    <Button type="button" onClick={() => onOpenChange(false)} variant="outline">Close</Button>
                 )}
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
