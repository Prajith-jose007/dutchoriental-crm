
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import type { Yacht } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { YachtFormDialog } from './_components/YachtFormDialog';
import { useToast } from '@/hooks/use-toast';
// Placeholder data is no longer the primary source after API integration
// import { placeholderYachts as initialYachtsData } from '@/lib/placeholder-data';

export default function YachtsPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isYachtDialogOpen, setIsYachtDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchYachts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/yachts');
      if (!response.ok) {
        throw new Error(`Failed to fetch yachts: ${response.statusText}`);
      }
      const data = await response.json();
      setYachts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching yachts:", error);
      toast({ title: 'Error Fetching Yachts', description: (error as Error).message, variant: 'destructive' });
      setYachts([]); // Fallback to empty
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYachts();
  }, []);

  const handleAddYachtClick = () => {
    setEditingYacht(null);
    setIsYachtDialogOpen(true);
  };

  const handleEditYachtClick = (yacht: Yacht) => {
    setEditingYacht(yacht);
    setIsYachtDialogOpen(true);
  };

  const handleYachtFormSubmit = async (submittedYachtData: Yacht) => {
     try {
      let response;
      if (editingYacht && submittedYachtData.id === editingYacht.id) {
        response = await fetch(`/api/yachts/${editingYacht.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedYachtData),
        });
      } else {
        // Client-side check for duplicate ID before POSTing
        const existingYacht = yachts.find(y => y.id === submittedYachtData.id);
        if (existingYacht && !editingYacht) { // Only check for new yachts
             toast({
                title: 'Error Adding Yacht',
                description: `Yacht with ID ${submittedYachtData.id} already exists.`,
                variant: 'destructive',
            });
            return; // Prevent API call
        }
        response = await fetch('/api/yachts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submittedYachtData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to save yacht: ${response.statusText}`);
      }
      
      toast({
        title: editingYacht ? 'Yacht Updated' : 'Yacht Added',
        description: `${submittedYachtData.name} has been saved.`,
      });
      
      fetchYachts(); // Re-fetch all yachts to reflect changes
      setIsYachtDialogOpen(false);
      setEditingYacht(null);

    } catch (error) {
      console.error("Error saving yacht:", error);
      toast({ title: 'Error Saving Yacht', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteYacht = async (yachtId: string) => {
    if (!confirm(`Are you sure you want to delete yacht ${yachtId}? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/yachts/${yachtId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete yacht: ${response.statusText}`);
      }
      toast({ title: 'Yacht Deleted', description: `Yacht ${yachtId} has been deleted.` });
      fetchYachts(); // Re-fetch yachts
    } catch (error) {
      console.error("Error deleting yacht:", error);
      toast({ title: 'Error Deleting Yacht', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="container mx-auto py-2 text-center">Loading yachts...</div>;
  }

  return (
    <div className="container mx-auto py-2">
      <PageHeader
        title="Yacht Management"
        description="View and manage your fleet of yachts. Click 'Edit' to see package rates."
        actions={
          <Button onClick={handleAddYachtClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Yacht
          </Button>
        }
      />
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
                  priority={false} // Set to true if these are LCP elements
                />
              </div>
              <CardTitle className="mt-4">{yacht.name}</CardTitle>
              <CardDescription>Capacity: {yacht.capacity} guests</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-sm text-muted-foreground">
                ID: {yacht.id} <br />
                Status: {yacht.status} <br />
                Click 'Edit' to view and manage package rates for this yacht.
              </p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 mt-auto pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => handleEditYachtClick(yacht)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteYacht(yacht.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {yachts.length === 0 && !isLoading && (
        <div className="text-center py-10 text-muted-foreground">
          No yachts found. Click "Add Yacht" to get started.
        </div>
      )}
      {isYachtDialogOpen && (
        <YachtFormDialog
          isOpen={isYachtDialogOpen}
          onOpenChange={setIsYachtDialogOpen}
          yacht={editingYacht}
          onSubmitSuccess={handleYachtFormSubmit}
        />
      )}
    </div>
  );
}
