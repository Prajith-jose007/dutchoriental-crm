
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
import type { Yacht, YachtPackageItem } from '@/lib/types';
import { useEffect } from 'react';
import { Trash2, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const packageItemSchema = z.object({
  id: z.string(), // Keep id for React key and potential future use
  name: z.string().min(1, 'Package name is required'),
  rate: z.coerce.number().min(0, 'Rate must be non-negative'),
});

const yachtFormSchema = z.object({
  id: z.string().min(1, 'Yacht ID is required'),
  name: z.string().min(2, 'Yacht name must be at least 2 characters'),
  imageUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  status: z.enum(['Available', 'Booked', 'Maintenance']),
  customPackageInfo: z.string().optional(),
  packages: z.array(packageItemSchema).optional().default([]),
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
  packages: [],
});


export function YachtFormDialog({ isOpen, onOpenChange, yacht, onSubmitSuccess, isAdmin }: YachtFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<YachtFormData>({
    resolver: zodResolver(yachtFormSchema),
    defaultValues: getDefaultYachtFormValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "packages",
  });

  useEffect(() => {
    if (isOpen) {
      const defaultValues = getDefaultYachtFormValues();
      if (yacht) {
        form.reset({
          ...defaultValues,
          ...yacht,
          imageUrl: yacht.imageUrl || '',
          customPackageInfo: yacht.customPackageInfo || '',
          packages: Array.isArray(yacht.packages) ? yacht.packages.map(p => ({...p, id: p.id || `pkg-${Date.now()}-${Math.random()}`})) : [],
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
      packages: data.packages || [],
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

              {/* Custom Packages Section */}
              <div className="pt-4 border-t mt-6">
                <h3 className="text-lg font-medium mb-2">Manage Custom Packages</h3>
                {fields.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end mb-3 p-3 border rounded-md">
                    <FormField
                      control={form.control}
                      name={`packages.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Name {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., VIP Drink Package"
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
                      name={`packages.${index}.rate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate (AED)</FormLabel>
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
                    {isAdmin && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(index)}
                        className="self-end mb-1" // Align with form message bottom or input bottom
                        aria-label="Remove package"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ id: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: '', rate: 0 })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Package
                  </Button>
                )}
                {fields.length === 0 && !isAdmin && (
                    <p className="text-sm text-muted-foreground">No custom packages defined for this yacht.</p>
                )}
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
