
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './_components/UsersTable';
import { UserFormDialog } from './_components/UserFormDialog';
import type { User } from '@/lib/types';
import { placeholderUsers as initialUsersDataSeed } from '@/lib/placeholder-data'; // Renamed for clarity
import { useToast } from '@/hooks/use-toast';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers';
const USER_ROLE_STORAGE_KEY = 'currentUserRole';

// This mutable array acts as our in-memory database for the session, initialized from localStorage or seed
let sessionUsers: User[] = [];

export default function UsersPage() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');

      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        sessionUsers = JSON.parse(storedUsers);
      } else {
        // Deep clone initialUsersDataSeed to avoid modifying the imported constant
        sessionUsers = JSON.parse(JSON.stringify(initialUsersDataSeed)); 
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sessionUsers));
      }
    } catch (error) {
      console.error("Error accessing or parsing users from localStorage:", error);
      // Fallback to seed data if localStorage fails
      sessionUsers = JSON.parse(JSON.stringify(initialUsersDataSeed));
       try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sessionUsers));
      } catch (storageError) {
        console.error("Failed to save fallback users to localStorage:", storageError);
      }
    }
    
    setUsers([...sessionUsers]); // Use a new array for React state to trigger re-render
    setIsLoading(false);
  }, []);


  const handleAddUserClick = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can add new users.", variant: "destructive"});
      return;
    }
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUserClick = (user: User) => {
     if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can edit users.", variant: "destructive"});
      return;
    }
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUserFormSubmit = (submittedUserData: User) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "You do not have permission to save user data.", variant: "destructive"});
      return;
    }
    
    const userIndex = sessionUsers.findIndex(u => u.id === submittedUserData.id);

    if (editingUser && userIndex > -1) { // Editing existing user
        // Preserve existing password if not provided in the form (important for simulation)
        const existingPassword = sessionUsers[userIndex].password;
        sessionUsers[userIndex] = {
            ...submittedUserData,
            password: submittedUserData.password || existingPassword // Keep old if new is empty
        };
        toast({ title: "User Updated", description: `${submittedUserData.name} has been updated.` });
    } else if (!editingUser && submittedUserData.id) { // Adding new user
        const isIdTaken = sessionUsers.some(u => u.id === submittedUserData.id);
        if (isIdTaken) {
            toast({ title: "Error", description: `User with ID ${submittedUserData.id} already exists. Please use a unique ID.`, variant: "destructive" });
            return; 
        }
        sessionUsers.push(submittedUserData); // Password already part of submittedUserData from form
        toast({ title: "User Added", description: `${submittedUserData.name} has been added.` });
    } else if (!editingUser && !submittedUserData.id) {
        // This case should ideally be prevented by form validation requiring ID for new users.
        toast({ title: "Error", description: "User ID is required to add a new user.", variant: "destructive" });
        return;
    } else {
        console.error("Error in user form submission logic: ", submittedUserData);
        toast({ title: "Error", description: "Could not save user due to an unknown issue.", variant: "destructive" });
        return;
    }

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sessionUsers));
    } catch (storageError) {
      console.error("Failed to save users to localStorage:", storageError);
      toast({ title: "Storage Error", description: "Could not save user changes to local storage.", variant: "destructive"});
    }
    setUsers([...sessionUsers]); // Update React state to re-render
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only admins can delete users.", variant: "destructive"});
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${userId}? This action cannot be undone.`)) {
      return;
    }
    
    const initialLength = sessionUsers.length;
    sessionUsers = sessionUsers.filter(user => user.id !== userId);

    if (sessionUsers.length < initialLength) {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sessionUsers));
        setUsers([...sessionUsers]);
        toast({ title: "User Deleted", description: `User ${userId} has been deleted.` });
      } catch (storageError) {
        console.error("Failed to save users to localStorage after deletion:", storageError);
        toast({ title: "Storage Error", description: "Could not save user changes after deletion to local storage.", variant: "destructive"});
      }
    } else {
      toast({ title: "Error", description: `User ${userId} not found.`, variant: "destructive"});
    }
  };
  
  if (isLoading) {
    return <div className="container mx-auto py-2 text-center">Loading users...</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="User Management"
        description="Manage your team members and their roles."
        actions={
            <Button onClick={handleAddUserClick} disabled={!isAdmin && isLoading}> {/* Disable if not admin or still loading admin status */}
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User {isAdmin ? "" : "(Admin Only)"}
            </Button>
        }
      />
      {!isAdmin && !isLoading && ( // Only show if not admin and admin status has loaded
        <p className="mb-4 text-sm text-destructive">
          Viewing user list. User management (add, edit, delete) is restricted to administrators.
        </p>
      )}
      <UsersTable users={users} onEditUser={handleEditUserClick} onDeleteUser={handleDeleteUser} isAdmin={isAdmin} />
      {isUserDialogOpen && (
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

```