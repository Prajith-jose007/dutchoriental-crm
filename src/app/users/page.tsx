
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './_components/UsersTable';
import { UserFormDialog } from './_components/UserFormDialog';
import type { User } from '@/lib/types';
import { placeholderUsers as initialUsersData } from '@/lib/placeholder-data';

const USERS_STORAGE_KEY = 'dutchOrientalCrmUsers';
let initialUsers: User[] = JSON.parse(JSON.stringify(initialUsersData));

export default function UsersPage() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let currentUsersData: User[];
    if (storedUsers) {
      try {
        currentUsersData = JSON.parse(storedUsers);
      } catch (error) {
        console.error("Error parsing users from localStorage:", error);
        currentUsersData = JSON.parse(JSON.stringify(initialUsersData));
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentUsersData));
      }
    } else {
      currentUsersData = JSON.parse(JSON.stringify(initialUsersData));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(currentUsersData));
    }
    initialUsers.length = 0;
    initialUsers.push(...currentUsersData);
    setUsers(currentUsersData);
  }, []);


  const handleAddUserClick = () => {
    setEditingUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUserClick = (user: User) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUserFormSubmit = (submittedUserData: User) => {
    const userIndex = initialUsers.findIndex(u => u.id === submittedUserData.id);
    if (editingUser && userIndex > -1) {
        initialUsers[userIndex] = submittedUserData;
    } else if (!editingUser && !initialUsers.some(u => u.id === submittedUserData.id)) {
        initialUsers.push(submittedUserData);
    } else if (!editingUser) {
        console.error("Trying to add a user with an existing ID or ID issue:", submittedUserData.id);
        return;
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    setUsers([...initialUsers]);
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="User Management"
        description="Manage your team members and their roles."
        actions={
          <Button onClick={handleAddUserClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <UsersTable users={users} onEditUser={handleEditUserClick} />
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
