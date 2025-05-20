
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './_components/UsersTable';
import { UserFormDialog } from './_components/UserFormDialog';
import type { User } from '@/lib/types';
import { placeholderUsers as initialUsers } from '@/lib/placeholder-data';

export default function UsersPage() {
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);

  useEffect(() => {
    // This ensures that if placeholderUsers data changes (e.g. HMR), the table updates.
    setUsers(initialUsers);
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
    if (editingUser) {
      // Update existing user
      setUsers(prevUsers => 
        prevUsers.map(u => u.id === submittedUserData.id ? submittedUserData : u)
      );
    } else {
      // Add new user
      setUsers(prevUsers => [...prevUsers, submittedUserData]);
    }
    // Also update initialUsers for persistence in this demo scenario.
    // In a real app, this would be an API call.
    const userIndex = initialUsers.findIndex(u => u.id === submittedUserData.id);
    if (userIndex > -1) {
        initialUsers[userIndex] = submittedUserData;
    } else {
        initialUsers.push(submittedUserData);
    }

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
      {isUserDialogOpen && ( // Conditionally render dialog to ensure form resets correctly on open
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
