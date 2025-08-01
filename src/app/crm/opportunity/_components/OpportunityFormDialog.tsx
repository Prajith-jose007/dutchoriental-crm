
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
  FormDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Slider } from '@/components/ui/slider';
import type { Opportunity, Yacht, YachtCategory } from '@/lib/types';
import { opportunityPipelinePhaseOptions, opportunityPriorityOptions, opportunityStatusOptions, yachtCategoryOptions } from '@/lib/types';
import { useEffect, useMemo } from 'react';
import { formatISO, parseISO, isValid } from 'date-fns';

const USER_ID_STORAGE_KEY = 'currentUserId';

const opportunityFormSchema = z.object({
  id: z.string().optional(),
  potentialCustomer: z.string().min(1, "Potential customer name is required"),
  ownerUserId: z.string().min(1, "Owner is required"),
  yachtId: z.string().min(1, "Yacht is required"),
  productType: z.enum(yachtCategoryOptions),
  pipelinePhase: z.enum(opportunityPipelinePhaseOptions),
  priority: z.enum(opportunityPriorityOptions),
  currentStatus: z.enum(opportunityStatusOptions),
  estimatedClosingDate: z.date({ required_error: "Estimated closing date is required." }),
  estimatedRevenue: z.coerce.number().min(0, "Estimated revenue must be non-negative"),
  closingProbability: z.coerce.number().min(0).max(100).optional().default(50),
  meanExpectedValue: z.coerce.number().min(0, "Mean expected value must be non-negative").optional(),
  followUpUpdates: z.string().optional(),
});

export type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

interface OpportunityFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
  onSubmitSuccess: (data: Opportunity) => void;
  allYachts: Yacht[];
  userMap: { [id: string]: string };
}

export function OpportunityFormDialog({ isOpen, onOpenChange, opportunity, onSubmitSuccess, allYachts, userMap }: OpportunityFormDialogProps) {
  
  const getInitialFormValues = (): OpportunityFormData => {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(USER_ID_STORAGE_KEY) : null;
    let closingProbability = 50;
    if (opportunity?.estimatedRevenue && opportunity?.meanExpectedValue) {
        if (opportunity.estimatedRevenue > 0) {
            closingProbability = Math.round((opportunity.meanExpectedValue / opportunity.estimatedRevenue) * 100);
        }
    } else if (opportunity?.closingProbability) {
        closingProbability = opportunity.closingProbability;
    }


    return {
      id: opportunity?.id,
      potentialCustomer: opportunity?.potentialCustomer || '',
      ownerUserId: opportunity?.ownerUserId || currentUserId || '',
      yachtId: opportunity?.yachtId || '',
      productType: opportunity?.productType || 'Private Cruise',
      pipelinePhase: opportunity?.pipelinePhase || 'New',
      priority: opportunity?.priority || 'Medium',
      currentStatus: opportunity?.currentStatus || 'Active',
      estimatedClosingDate: opportunity?.estimatedClosingDate && isValid(parseISO(opportunity.estimatedClosingDate)) ? parseISO(opportunity.estimatedClosingDate) : new Date(),
      estimatedRevenue: opportunity?.estimatedRevenue || 0,
      closingProbability: closingProbability,
      meanExpectedValue: opportunity?.meanExpectedValue || (opportunity?.estimatedRevenue || 0) * (closingProbability / 100),
      followUpUpdates: opportunity?.followUpUpdates || '',
    };
  };

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: getInitialFormValues(),
  });

  const watchedEstimatedRevenue = form.watch('estimatedRevenue');
  const watchedClosingProbability = form.watch('closingProbability');

  useEffect(() => {
    if (isOpen) {
      form.reset(getInitialFormValues());
    }
  }, [opportunity, isOpen]);
  
   useEffect(() => {
    const revenue = watchedEstimatedRevenue || 0;
    const probability = (watchedClosingProbability || 0) / 100;
    const meanValue = revenue * probability;
    form.setValue('meanExpectedValue', parseFloat(meanValue.toFixed(2)));
  }, [watchedEstimatedRevenue, watchedClosingProbability, form]);


  const onSubmit = (data: OpportunityFormData) => {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(USER_ID_STORAGE_KEY) : null;
    const submittedOpp: Opportunity = {
      ...data,
      id: opportunity?.id || `OPP-${Date.now()}`,
      estimatedClosingDate: formatISO(data.estimatedClosingDate),
      createdAt: opportunity?.createdAt || formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      ownerUserId: data.ownerUserId || currentUserId || '',
    };
    onSubmitSuccess(submittedOpp);
    onOpenChange(false);
  };
  
  const filteredYachts = useMemo(() => {
    const selectedProductType = form.watch('productType');
    return allYachts.filter(y => y.category === selectedProductType);
  }, [form.watch('productType'), allYachts]);

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'productType' && type === 'change') {
        form.setValue('yachtId', ''); // Reset yacht when product type changes
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{opportunity ? 'Edit Opportunity' : 'Add New Opportunity'}</DialogTitle>
          <DialogDescription>
            {opportunity ? 'Update the details for this opportunity.' : 'Fill in the details for the new opportunity.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="potentialCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potential Customer</FormLabel>
                      <FormControl><Input placeholder="e.g., Global Innovations Inc." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select an owner" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(userMap).map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select product type" /></SelectTrigger></FormControl>
                            <SelectContent>
                            {yachtCategoryOptions.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="yachtId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yacht</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined} defaultValue={field.value} disabled={!form.watch('productType')}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a yacht" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {filteredYachts.map((yacht) => (
                            <SelectItem key={yacht.id} value={yacht.id}>{yacht.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pipelinePhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline Phase</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {opportunityPipelinePhaseOptions.map(phase => (
                            <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {opportunityPriorityOptions.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedClosingDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Estimated Closing Date</FormLabel>
                      <DatePicker date={field.value} setDate={field.onChange} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="currentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {opportunityStatusOptions.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Revenue (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="closingProbability"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Probability of Closing ({field.value || 0}%)</FormLabel>
                            <FormControl>
                                <Slider
                                    defaultValue={[field.value || 50]}
                                    value={[field.value || 50]}
                                    max={100}
                                    step={5}
                                    onValueChange={(value) => field.onChange(value[0])}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                    />
                 <FormField
                  control={form.control}
                  name="meanExpectedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mean Expected Value (AED)</FormLabel>
                      <FormControl><Input type="number" placeholder="0" {...field} value={field.value || ''} readOnly className="bg-muted/50 cursor-not-allowed" /></FormControl>
                      <FormDescription>Auto-calculated from revenue & probability.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="followUpUpdates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Follow-up Updates & Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add any notes or updates about this opportunity..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">{opportunity ? 'Save Changes' : 'Add Opportunity'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
