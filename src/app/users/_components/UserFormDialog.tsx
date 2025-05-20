
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
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useEffect } from 'react';

const userFormSchema = z.object({
  id: z.string().optional(), // Auto-generated for new, present for edit
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  designation: z.string().min(2, 'Designation is required'),
  commissionRate: z.coerce.number().min(0).max(100).optional().default(0),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null; // For editing
  onSubmitSuccess: (data: User) => void;
}

export function UserFormDialog({ isOpen, onOpenChange, user, onSubmitSuccess }: UserFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user ? {
      ...user,
      commissionRate: user.commissionRate || 0,
    } : {
      name: '',
      email: '',
      designation: '',
      commissionRate: 0,
      avatarUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(user ? {
        ...user,
        commissionRate: user.commissionRate || 0,
        avatarUrl: user.avatarUrl || '',
      } : {
        id: undefined,
        name: '',
        email: '',
        designation: '',
        commissionRate: 0,
        avatarUrl: '',
      });
    }
  }, [user, form, isOpen]);

  function onSubmit(data: UserFormData) {
    const submittedUser: User = {
      ...data,
      id: user?.id || `user-${Date.now()}`, // Generate ID if new
      commissionRate: data.commissionRate || 0,
      avatarUrl: data.avatarUrl || undefined,
    };
    onSubmitSuccess(submittedUser);
    toast({
      title: user ? 'User Updated' : 'User Added',
      description: `${data.name} has been ${user ? 'updated' : 'added'}.`,
    });
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
              name="commissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Rate (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 10" {...field} />
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
                    <Input placeholder="https://placehold.co/100x100.png" {...field} />
                  </FormControl>
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
