
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import type { Yacht } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { YachtFormDialog } from './_components/YachtFormDialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const USER_ROLE_STORAGE_KEY = 'currentUserRole';

export default function YachtsPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isYachtDialogOpen, setIsYachtDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchYachts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/yachts');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to fetch yachts: ${response.statusText}`);
      }
      const data = await response.json();
      setYachts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching yachts:", error);
      toast({ title: 'Error Fetching Yachts', description: (error as Error).message, variant: 'destructive' });
      setYachts([]);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    try {
      const role = localStorage.getItem(USER_ROLE_STORAGE_KEY);
      setIsAdmin(role === 'admin');
    } catch (e) {
      console.error("Error accessing localStorage for user role:", e);
      setIsAdmin(false);
    }
    fetchYachts();
  }, [fetchYachts]);

  const handleAddYachtClick = () => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can add yachts.", variant: "destructive" });
      return;
    }
    setEditingYacht(null);
    setIsYachtDialogOpen(true);
  };

  const handleEditYachtClick = (yacht: Yacht) => {
    // For non-admins, this opens the dialog in a read-only like state (form fields disabled by isAdmin prop in dialog)
    setEditingYacht(yacht);
    setIsYachtDialogOpen(true);
  };

  const handleYachtFormSubmit = async (submittedYachtData: Yacht) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "You do not have permission to save yacht data.", variant: "destructive" });
      return;
    }
    try {
      let response;
      if (editingYacht && submittedYachtData.id === editingYacht.id) {
        response = await fetch(`/api/yachts/${editingYacht.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedYachtData),
        });
      } else {
        const existingYachtResponse = await fetch('/api/yachts');
        if (!existingYachtResponse.ok) throw new Error('Could not verify existing yachts.');
        const currentYachts: Yacht[] = await existingYachtResponse.json();

        const existingYachtById = currentYachts.find(y => y.id === submittedYachtData.id);
        if (existingYachtById && !editingYacht) {
          toast({
            title: 'Error Adding Yacht',
            description: `Yacht with ID ${submittedYachtData.id} already exists.`,
            variant: 'destructive',
          });
          return;
        }
        response = await fetch('/api/yachts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedYachtData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to save yacht: ${response.statusText}`);
      }

      toast({
        title: editingYacht ? 'Yacht Updated' : 'Yacht Added',
        description: `${submittedYachtData.name} has been saved.`,
      });

      fetchYachts();
      setIsYachtDialogOpen(false);
      setEditingYacht(null);

    } catch (error) {
      console.error("Error saving yacht:", error);
      toast({ title: 'Error Saving Yacht', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteYacht = async (yachtId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can delete yachts.", variant: "destructive" });
      return;
    }
    if (!confirm(`Are you sure you want to delete yacht ${yachtId}? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/yachts/${yachtId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Failed to delete yacht: ${response.statusText}`);
      }
      toast({ title: 'Yacht Deleted', description: `Yacht ${yachtId} has been deleted.` });
      fetchYachts();
    } catch (error) {
      console.error("Error deleting yacht:", error);
      toast({ title: 'Error Deleting Yacht', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-2">
        <PageHeader title="Yacht Management" description="Loading yachts..." />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="aspect-[16/9] w-full rounded-t-lg" />
                <Skeleton className="h-6 w-3/4 mt-4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
              <CardFooter className="flex justify-end gap-2 mt-auto pt-4 border-t">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Yacht Management"
        description="View and manage your fleet of yachts. Click &apos;Edit&apos; to see package rates and custom info."
        actions={
          isAdmin && (
            <Button onClick={handleAddYachtClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Yacht
            </Button>
          )
        }
      />
      {!isAdmin && !isLoading && (
        <p className="mb-4 text-sm text-muted-foreground">
          Viewing yachts. Management actions (add, edit rates, delete) are restricted to administrators.
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {yachts.map((yacht) => (
          <Card key={yacht.id} className="flex flex-col">
            <CardHeader>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg">
                <Image
                  src={yacht.imageUrl || `https://placehold.co/600x400.png`}
                  alt={yacht.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint="yacht boat"
                  priority={false}
                />
              </div>
              <CardTitle className="mt-4">{yacht.name}</CardTitle>
              <CardDescription>Capacity: {yacht.capacity} guests</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-sm text-muted-foreground">
                ID: {yacht.id} <br />
                Status: {yacht.status} <br />
                <span className="italic">Click &apos;Details/Edit&apos; to view rates and custom package info.</span>
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 mt-auto pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => handleEditYachtClick(yacht)}>
                <Edit className="mr-2 h-4 w-4" /> {isAdmin ? 'Edit' : 'Details'}
              </Button>
              {isAdmin && (
                <Button variant="destructive" size="sm" onClick={() => handleDeleteYacht(yacht.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      {yachts.length === 0 && !isLoading && (
        <div className="text-center py-10 text-muted-foreground">
          No yachts found. {isAdmin ? 'Click "Add Yacht" to get started.' : 'Please contact an administrator to add yachts.'}
        </div>
      )}
      {isYachtDialogOpen && (
        <YachtFormDialog
          isOpen={isYachtDialogOpen}
          onOpenChange={setIsYachtDialogOpen}
          yacht={editingYacht}
          onSubmitSuccess={handleYachtFormSubmit}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

