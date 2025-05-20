
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

const agentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Agent name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  discountRate: z.coerce.number().min(0, "Rate must be non-negative").max(100, 'Rate cannot exceed 100%'),
  websiteUrl: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Archived']),
});

export type AgentFormData = z.infer<typeof agentFormSchema>;

interface AgentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null;
  onSubmitSuccess: (data: Agent) => void;
}

const statusOptions: Agent['status'][] = ['Active', 'Inactive', 'Archived'];

export function AgentFormDialog({ isOpen, onOpenChange, agent, onSubmitSuccess }: AgentFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentFormSchema),
    defaultValues: agent || {
      name: '',
      email: '',
      discountRate: 0,
      websiteUrl: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(agent ? {
        ...agent,
        websiteUrl: agent.websiteUrl || '',
      } : {
        id: undefined,
        name: '',
        email: '',
        discountRate: 0,
        websiteUrl: '',
        status: 'Active',
      });
    }
  }, [agent, form, isOpen]);

  function onSubmit(data: AgentFormData) {
    const submittedAgent: Agent = {
      ...data,
      id: agent?.id || `agent-${Date.now()}`, // Generate ID if new
      websiteUrl: data.websiteUrl || undefined,
    };
    onSubmitSuccess(submittedAgent);
    toast({
      title: agent ? 'Agent Updated' : 'Agent Added',
      description: `${data.name} has been ${agent ? 'updated' : 'added'}.`,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
          <DialogDescription>
            {agent ? 'Update the details for this agent.' : 'Fill in the details for the new agent.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              name="discountRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Rate (%)</FormLabel>
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
                    <Input placeholder="https://supercharters.com" {...field} />
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
