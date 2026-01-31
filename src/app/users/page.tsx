
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './_components/UsersTable';
import { UserFormDialog } from './_components/UserFormDialog';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export default function UsersPage() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: 'Error Fetching Users', description: (error as Error).message, variant: 'destructive' });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      const r = role?.trim().toLowerCase();
      const isSuperOrAdmin = r === 'admin' || r === 'super admin' || r === 'system administrator';
      console.log('User Role Debug:', { raw: role, refined: r, access: isSuperOrAdmin });
      setIsAdmin(isSuperOrAdmin);
    } catch (error) {
      console.error("Error accessing localStorage for user role:", error);
      setIsAdmin(false);
    }
    fetchUsers();
  }, [fetchUsers]);


  const handleAddUserClick = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can add new users.", variant: "destructive" });
      return;
    }
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUserClick = (user: User) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can edit users.", variant: "destructive" });
      return;
    }
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUserFormSubmit = async (submittedUserData: User) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "You do not have permission to save user data.", variant: "destructive" });
      return;
    }

    // Ensure ID is present for new users, as UserFormDialog schema might make it optional
    if (!editingUser && !submittedUserData.id) {
      toast({ title: "Error Adding User", description: "User ID is required.", variant: "destructive" });
      return;
    }

    try {
      let response;
      const payload = { ...submittedUserData };
      // If password is empty string for edit, don't send it (API handles not updating password)
      if (editingUser && payload.password === '') {
        delete payload.password;
      }


      if (editingUser) { // Editing existing user
        response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else { // Adding new user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to save user: ${response.statusText}`);
      }

      toast({ title: editingUser ? "User Updated" : "User Added", description: `${submittedUserData.name} has been saved.` });
      fetchUsers(); // Re-fetch to update the table
      setIsUserDialogOpen(false);
      setEditingUser(null);

    } catch (error) {
      console.error("Error saving user:", error);
      toast({ title: 'Error Saving User', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can delete users.", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${userId}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to delete user: ${response.statusText}`);
      }
      toast({ title: "User Deleted", description: `User ${userId} has been deleted.` });
      fetchUsers(); // Re-fetch to update table
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: 'Error Deleting User', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading && !isAdmin && typeof window !== 'undefined' && !localStorage.getItem(USER_ROLE_STORAGE_KEY)) {
    // Special loading state if not admin and initial auth role hasn't been determined yet
    // This helps prevent flashing the "Access Denied" message too early
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="User Management" description="Loading user data and permissions..." />
        <Skeleton className="h-10 w-36 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }


  if (!isAdmin && !isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="User Management"
          description="Access Denied. User management is restricted to administrators."
        />
        <p className="text-destructive text-center py-10">
          You do not have permission to view or manage user data.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader
          title="User Management"
          description="Manage your team members and their roles."
          actions={
            <Button onClick={handleAddUserClick} disabled={true}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User (Admin Only)
            </Button>
          }
        />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }


  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="User Management"
        description="Manage your team members and their roles."
        actions={
          <Button onClick={handleAddUserClick} disabled={!isAdmin}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User {isAdmin ? "" : "(Admin Only)"}
          </Button>
        }
      />
      <UsersTable users={users} onEditUser={handleEditUserClick} onDeleteUser={handleDeleteUser} isAdmin={isAdmin} />
      {isUserDialogOpen && isAdmin && (
        <UserFormDialog
          isOpen={isUserDialogOpen}
          onOpenChange={setIsUserDialogOpen}
          user={editingUser}
          onSubmitSuccess={handleUserFormSubmit}
        />
      )}
    </div>
  );
}
