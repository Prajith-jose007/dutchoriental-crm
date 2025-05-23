
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './_components/UsersTable';
import { UserFormDialog } from './_components/UserFormDialog';
import type { User } from '@/lib/types';
import { placeholderUsers as initialUsersData } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers';
const USER_ROLE_STORAGE_KEY = 'currentUserRole';

// This mutable array acts as our in-memory database for the session
let sessionUsers: User[] = [];

export default function UsersPage() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check user role from localStorage
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');
    } catch (error) {
      console.error("Error accessing localStorage for user role:", error);
      setIsAdmin(false); // Default to non-admin if localStorage is inaccessible
    }
    

    // Load users from localStorage or initialize with placeholder data
    let currentUsersData: User[];
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsers) {
        currentUsersData = JSON.parse(storedUsers);
      } else {
        currentUsersData = JSON.parse(JSON.stringify(initialUsersData)); // Deep copy
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentUsersData));
      }
    } catch (error) {
      console.error("Error accessing or parsing users from localStorage:", error);
      currentUsersData = JSON.parse(JSON.stringify(initialUsersData)); // Fallback on error
       try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentUsersData));
      } catch (storageError) {
        console.error("Failed to save fallback users to localStorage:", storageError);
      }
    }
    
    sessionUsers = [...currentUsersData]; // Update the session-level store
    setUsers(currentUsersData);
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
    if (editingUser && userIndex > -1) {
        sessionUsers[userIndex] = submittedUserData;
         toast({ title: "User Updated", description: `${submittedUserData.name} has been updated.` });
    } else if (!editingUser && !sessionUsers.some(u => u.id === submittedUserData.id)) {
        sessionUsers.push(submittedUserData);
         toast({ title: "User Added", description: `${submittedUserData.name} has been added.` });
    } else if (!editingUser && sessionUsers.some(u => u.id === submittedUserData.id)) {
        toast({ title: "Error", description: `User with ID ${submittedUserData.id} already exists.`, variant: "destructive" });
        return; 
    } else {
        console.error("ID issue or trying to add user with existing ID:", submittedUserData.id);
        toast({ title: "Error", description: "Could not save user due to an ID conflict or unknown issue.", variant: "destructive" });
        return;
    }

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sessionUsers));
    } catch (storageError) {
      console.error("Failed to save users to localStorage:", storageError);
      toast({ title: "Storage Error", description: "Could not save user changes.", variant: "destructive"});
    }
    setUsers([...sessionUsers]); // Update React state to re-render
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="User Management"
        description="Manage your team members and their roles."
        actions={
          isAdmin ? (
            <Button onClick={handleAddUserClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
          ) : (
            <Button onClick={handleAddUserClick} disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User (Admin Only)
            </Button>
          )
        }
      />
      {!isAdmin && (
        <p className="mb-4 text-sm text-destructive">
          User management is restricted to administrators.
        </p>
      )}
      <UsersTable users={users} onEditUser={handleEditUserClick} isAdmin={isAdmin} />
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
