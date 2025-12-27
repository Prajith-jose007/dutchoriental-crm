
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
import type { Agent } from '@/lib/types';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

const agentFormSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(2, 'Agent name must be at least 2 characters'),
  agency_code: z.string().optional(),
  address: z.string().optional(),
  phone_no: z.string().optional(),
  email: z.string().email('Invalid email address'),
  discount: z.coerce.number().min(0, "Rate must be non-negative").max(100, 'Rate cannot exceed 100%'),
  websiteUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  status: z.enum(['Active', 'Non Active', 'Dead']),
  TRN_number: z.string().optional(),
  customer_type_id: z.string().optional(), // Added
});

export type AgentFormData = z.infer<typeof agentFormSchema>;

interface AgentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onSubmitSuccess: (data: Agent) => void;
}

const statusOptions: Agent['status'][] = ['Active', 'Non Active', 'Dead'];

export function AgentFormDialog({ isOpen, onOpenChange, agent, onSubmitSuccess }: AgentFormDialogProps) {
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: agent || {
      id: '',
      name: '',
      agency_code: '',
      address: '',
      phone_no: '',
      email: '',
      discount: 0,
      websiteUrl: '',
      status: 'Active',
      TRN_number: '',
      customer_type_id: '', // Added
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (agent) {
        form.reset({
          ...agent,
          websiteUrl: agent.websiteUrl || '',
          agency_code: agent.agency_code || '',
          address: agent.address || '',
          phone_no: agent.phone_no || '',
          TRN_number: agent.TRN_number || '',
          customer_type_id: agent.customer_type_id || '', // Added
        });
      } else {
        form.reset({
          id: '',
          name: '',
          agency_code: '',
          address: '',
          phone_no: '',
          email: '',
          discount: 0,
          websiteUrl: '',
          status: 'Active',
          TRN_number: '',
          customer_type_id: '', // Added
        });
      }
    }
  }, [agent, form, isOpen]);

  function onSubmit(data: AgentFormData) {
    const submittedAgent: Agent = {
      ...data,
      websiteUrl: data.websiteUrl || undefined,
      agency_code: data.agency_code || undefined,
      address: data.address || undefined,
      phone_no: data.phone_no || undefined,
      TRN_number: data.TRN_number || undefined,
      customer_type_id: data.customer_type_id || undefined, // Added
    };
    onSubmitSuccess(submittedAgent);
    // Toast handled by parent page now
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
          <DialogDescription>
            {agent ? 'Update the details for this agent.' : 'Fill in the details for the new agent.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., DO-001"
                        {...field}
                        readOnly={!!agent}
                        className={!!agent ? "bg-muted/50" : ""}
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
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Super Charters Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agency_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agency Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SC001" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +971501234567" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered Email ID</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g., contact@supercharters.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (%)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Website URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://supercharters.com" {...field} value={field.value || ''} />
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
              <FormField
                control={form.control}
                name="TRN_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TRN Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 100XXXXXXXXXX03" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CUST-TYPE-001" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter agent's address" className="resize-y" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{agent ? 'Save Changes' : 'Add Agent'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
