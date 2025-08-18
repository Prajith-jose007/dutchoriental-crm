
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
import { useToast } from '@/hooks/use-toast';
import type { Agent } from '@/lib/types';
import { useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

const clientFormSchema = z.object({
  id: z.string().min(1, 'Client ID is required'),
  name: z.string().min(2, 'Client name must be at least 2 characters'),
  agency_code: z.string().optional(),
  address: z.string().optional(),
  phone_no: z.string().optional(),
  email: z.string().email('Invalid email address'),
  discount: z.coerce.number().min(0, "Rate must be non-negative").max(100, 'Rate cannot exceed 100%').optional(),
  websiteUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  status: z.enum(['Active', 'Non Active', 'Dead']),
  TRN_number: z.string().optional(),
  // Re-purposing customer_type_id to be parentClientId
  customer_type_id: z.string().optional(), 
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Agent | null;
  allClients: Agent[];
  onSubmitSuccess: (data: Agent) => void;
}

const statusOptions: Agent['status'][] = ['Active', 'Non Active', 'Dead'];

export function ClientFormDialog({ isOpen, onOpenChange, client, allClients, onSubmitSuccess }: ClientFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: client || {
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
      customer_type_id: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (client) {
        form.reset({
          ...client,
          websiteUrl: client.websiteUrl || '',
          agency_code: client.agency_code || '',
          address: client.address || '',
          phone_no: client.phone_no || '',
          TRN_number: client.TRN_number || '',
          customer_type_id: client.customer_type_id || '',
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
          customer_type_id: '',
        });
      }
    }
  }, [client, form, isOpen]);

  function onSubmit(data: ClientFormData) {
    const submittedClient: Agent = {
      ...data,
      // For now, we will map the fields back to the Agent type.
      // This will be refactored later to a dedicated Client type.
      websiteUrl: data.websiteUrl || undefined,
      agency_code: data.agency_code || undefined,
      address: data.address || undefined,
      phone_no: data.phone_no || undefined,
      TRN_number: data.TRN_number || undefined,
      customer_type_id: data.customer_type_id || undefined,
      discount: data.discount || 0,
    };
    onSubmitSuccess(submittedClient);
    onOpenChange(false);
  }
  
  const potentialParents = allClients.filter(c => c.id !== client?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle>{client ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {client ? 'Update the details for this client.' : 'Fill in the details for the new client.'}
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
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., C-001" 
                        {...field} 
                        readOnly={!!client} 
                        className={!!client ? "bg-muted/50" : ""}
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
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Global Innovations Inc." {...field} />
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
                      <Input placeholder="e.g., +971501234567" {...field} value={field.value || ''}/>
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
                      <Input type="email" placeholder="e.g., contact@globalinnovations.com" {...field} />
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
                name="customer_type_id" // This is repurposed as parentClientId
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Organization (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parent organization" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No Parent</SelectItem>
                        {potentialParents.map(parent => (
                          <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{client ? 'Save Changes' : 'Add Client'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
