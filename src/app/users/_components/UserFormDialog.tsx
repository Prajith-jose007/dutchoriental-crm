
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
  FormDescription,
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

const userFormSchemaBase = z.object({
  id: z.string().min(1, 'User ID is required').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  designation: z.string().min(2, 'Designation is required'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive', 'Archived']).optional().default('Active'),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

// Separate schemas for create and edit to handle password requirements
const createUserFormSchema = userFormSchemaBase.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // path of error
});

const editUserFormSchema = userFormSchemaBase.extend({
  password: z.string().optional(), // Password is optional when editing
  confirmPassword: z.string().optional(),
}).refine(data => {
  // Only validate if new password is being set
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine(data => {
    if (data.password && data.password.length > 0 && data.password.length < 6) {
        return false;
    }
    return true;
}, {
    message: "New password must be at least 6 characters if provided",
    path: ['password'],
});


export type UserFormData = z.infer<typeof userFormSchemaBase>;

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSubmitSuccess: (data: User) => void;
}

const statusOptions: User['status'][] = ['Active', 'Inactive', 'Archived'];

export function UserFormDialog({ isOpen, onOpenChange, user, onSubmitSuccess }: UserFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? editUserFormSchema : createUserFormSchema),
    defaultValues: user ? {
      ...user,
      websiteUrl: user.websiteUrl || '',
      status: user.status || 'Active',
      password: '', // Clear password fields for editing
      confirmPassword: '',
    } : {
      id: '',
      name: '',
      email: '',
      designation: '',
      avatarUrl: '',
      websiteUrl: '',
      status: 'Active',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        form.reset({
          ...user,
          websiteUrl: user.websiteUrl || '',
          status: user.status || 'Active',
          password: '', // Clear password fields when opening for edit
          confirmPassword: '',
        });
      } else {
        form.reset({
          id: '',
          name: '',
          email: '',
          designation: '',
          avatarUrl: '',
          websiteUrl: '',
          status: 'Active',
          password: '',
          confirmPassword: '',
        });
      }
    }
  }, [user, form, isOpen]);

  function onSubmit(data: UserFormData) {
    if (!data.id && !user) {
        toast({ title: "Error", description: "User ID is required for new users.", variant: "destructive" });
        form.setError("id", { type: "manual", message: "User ID is required." });
        return;
    }
    
    const submittedUser: User = {
      id: user?.id || data.id!,
      name: data.name,
      email: data.email,
      designation: data.designation,
      avatarUrl: data.avatarUrl || undefined,
      websiteUrl: data.websiteUrl || undefined,
      status: data.status || 'Active',
      // IMPORTANT: In a real app, password would be hashed server-side.
      // For this simulation, we just pass it along if provided.
      // Do NOT store plaintext passwords in a real system.
      password: data.password && data.password.length > 0 ? data.password : undefined,
    };
    onSubmitSuccess(submittedUser);
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
                      value={field.value || ''}
                      readOnly={!!user} 
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? 'New Password' : 'Password'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={isEditing ? "Leave blank to keep current" : "••••••••"} {...field} />
                  </FormControl>
                  {isEditing && <FormDescription>Leave blank to keep the current password.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? 'Confirm New Password' : 'Confirm Password'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
