
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
import type { User } from '@/lib/types';
import { useEffect } from 'react';

// User ID is now optional in the schema for new users, but will be required by form for submission
const userFormSchema = z.object({
  id: z.string().min(1, 'User ID is required').optional(), // Made optional for initial state, but form will handle it
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  designation: z.string().min(2, 'Designation is required'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Archived']).optional().default('Active'),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmitSuccess: (data: User) => void;
}

const statusOptions: User['status'][] = ['Active', 'Inactive', 'Archived'];

export function UserFormDialog({ isOpen, onOpenChange, user, onSubmitSuccess }: UserFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user ? {
      ...user,
      websiteUrl: user.websiteUrl || '',
      status: user.status || 'Active',
    } : {
      id: '', // Default to empty, will be filled by user
      name: '',
      email: '',
      designation: '',
      avatarUrl: '',
      websiteUrl: '',
      status: 'Active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          ...user,
          websiteUrl: user.websiteUrl || '',
          status: user.status || 'Active',
        });
      } else {
        // When adding new, explicitly set id to empty string for the input field
        form.reset({
          id: '',
          name: '',
          email: '',
          designation: '',
          avatarUrl: '',
          websiteUrl: '',
          status: 'Active',
        });
      }
    }
  }, [user, form, isOpen]);

  function onSubmit(data: UserFormData) {
    // Ensure ID is present, especially for new users
    if (!data.id && !user) {
        toast({ title: "Error", description: "User ID is required for new users.", variant: "destructive" });
        form.setError("id", { type: "manual", message: "User ID is required." });
        return;
    }
    
    const submittedUser: User = {
      ...data,
      id: user?.id || data.id!, // Use existing ID if editing, otherwise use form ID
      avatarUrl: data.avatarUrl || undefined,
      websiteUrl: data.websiteUrl || undefined,
      status: data.status || 'Active',
    };
    onSubmitSuccess(submittedUser);
    // Toast is handled by the parent page
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {user ? 'Update the details for this user.' : 'Fill in the details for the new user.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., user001" 
                      {...field} 
                      value={field.value || ''} // Ensure controlled component
                      readOnly={!!user} // Read-only if editing an existing user
                      className={!!user ? "bg-muted/50" : ""}
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
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sales Agent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://placehold.co/100x100.png" {...field} value={field.value || ''} />
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
                  <FormLabel>Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} value={field.value || ''}/>
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
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{user ? 'Save Changes' : 'Add User'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
