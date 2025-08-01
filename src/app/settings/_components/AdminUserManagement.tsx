'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export function AdminUserManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management (Admin)</CardTitle>
        <CardDescription>Add, edit, or remove users from the CRM system.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4 items-start">
        <Link href="/users">
          <Button variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Go to User Management Page
          </Button>
        </Link>
        {/* Or, include a simplified "Add User" form here if preferred */}
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User (Quick Add)
        </Button>
      </CardContent>
    </Card>
  );
}
