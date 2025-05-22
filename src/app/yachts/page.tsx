
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { placeholderYachts as initialYachtsData } from '@/lib/placeholder-data';
import type { Yacht } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { YachtFormDialog } from './_components/YachtFormDialog';
import { useToast } from '@/hooks/use-toast';

const YACHTS_STORAGE_KEY = 'dutchOrientalCrmYachts';
let initialYachts: Yacht[] = JSON.parse(JSON.stringify(initialYachtsData));

export default function YachtsPage() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isYachtDialogOpen, setIsYachtDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedYachts = localStorage.getItem(YACHTS_STORAGE_KEY);
    let currentYachtsData: Yacht[];
    if (storedYachts) {
      try {
        currentYachtsData = JSON.parse(storedYachts);
      } catch (error) {
        console.error("Error parsing yachts from localStorage:", error);
        currentYachtsData = JSON.parse(JSON.stringify(initialYachtsData));
        localStorage.setItem(YACHTS_STORAGE_KEY, JSON.stringify(currentYachtsData));
      }
    } else {
      currentYachtsData = JSON.parse(JSON.stringify(initialYachtsData));
      localStorage.setItem(YACHTS_STORAGE_KEY, JSON.stringify(currentYachtsData));
    }
    initialYachts.length = 0;
    initialYachts.push(...currentYachtsData);
    setYachts(currentYachtsData);
  }, []);

  const handleAddYachtClick = () => {
    setEditingYacht(null);
    setIsYachtDialogOpen(true);
  };

  const handleEditYachtClick = (yacht: Yacht) => {
    setEditingYacht(yacht);
    setIsYachtDialogOpen(true);
  };

  const handleYachtFormSubmit = (submittedYachtData: Yacht) => {
    const yachtIndex = initialYachts.findIndex(y => y.id === submittedYachtData.id);

    if (editingYacht && yachtIndex > -1) {
      initialYachts[yachtIndex] = submittedYachtData;
    } else if (!editingYacht && !initialYachts.some(y => y.id === submittedYachtData.id)) {
      initialYachts.push(submittedYachtData);
    } else if (!editingYacht) {
      toast({
        title: "Error",
        description: `Yacht with ID ${submittedYachtData.id} already exists or ID is invalid.`,
        variant: "destructive",
      });
      return;
    }
    
    localStorage.setItem(YACHTS_STORAGE_KEY, JSON.stringify(initialYachts));
    setYachts([...initialYachts]);
    setIsYachtDialogOpen(false);
    setEditingYacht(null);
  };

  const handleDeleteYacht = (yachtId: string) => {
    initialYachts = initialYachts.filter(y => y.id !== yachtId);
    localStorage.setItem(YACHTS_STORAGE_KEY, JSON.stringify(initialYachts));
    setYachts([...initialYachts]);
    toast({
        title: "Yacht Deleted",
        description: `Yacht with ID ${yachtId} has been removed.`,
    });
  };

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
                  src={yacht.imageUrl || `https://placehold.co/300x200.png`}
                  alt={yacht.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint="yacht boat"
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
      {yachts.length === 0 && (
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
