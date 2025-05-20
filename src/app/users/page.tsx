import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { UsersTable } from './_components/UsersTable';

export default function UsersPage() {
  // TODO: Implement Add User functionality (e.g., open a dialog or navigate to a form)
  const handleAddUser = () => {
    console.log('Add new user');
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="User Management"
        description="Manage your team members and their roles."
        actions={
          <Button onClick={handleAddUser}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <UsersTable />
    </div>
  );
}
