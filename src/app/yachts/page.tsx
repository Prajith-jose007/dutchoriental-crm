
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// Removed Badge import as it's no longer used for status on cards
import { PageHeader } from '@/components/PageHeader';
import { placeholderYachts as initialYachts } from '@/lib/placeholder-data';
import type { Yacht } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react'; // Removed Zap, Wrench, ShipIcon as they were for status
import { YachtFormDialog } from './_components/YachtFormDialog'; 

export default function YachtsPage() {
  const [yachts, setYachts] = useState<Yacht[]>(initialYachts);
  const [isYachtDialogOpen, setIsYachtDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);

  useEffect(() => {
    setYachts(initialYachts);
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
    if (editingYacht) {
      setYachts(prevYachts =>
        prevYachts.map(y => (y.id === editingYacht.id ? submittedYachtData : y))
      );
      const yachtIndex = initialYachts.findIndex(y => y.id === editingYacht.id);
      if (yachtIndex > -1) {
        initialYachts[yachtIndex] = submittedYachtData;
      }
    } else {
      setYachts(prevYachts => [...prevYachts, submittedYachtData]);
      initialYachts.push(submittedYachtData);
    }
    setIsYachtDialogOpen(false);
    setEditingYacht(null);
  };
  
  const handleDeleteYacht = (yachtId: string) => {
    console.warn('Delete yacht action (not fully implemented)', yachtId);
    setYachts(prevYachts => prevYachts.filter(y => y.id !== yachtId));
    const yachtIndex = initialYachts.findIndex(y => y.id === yachtId);
    if (yachtIndex > -1) {
        initialYachts.splice(yachtIndex, 1);
    }
  };

  // Removed getStatusBadgeVariant and getStatusIcon functions

  const renderPackageCosts = (yacht: Yacht) => {
    const costs = [
      { label: 'Dhow Child', value: yacht.dhowChild89_rate },
      { label: 'Dhow Food', value: yacht.dhowFood99_rate },
      { label: 'Dhow Drinks', value: yacht.dhowDrinks199_rate },
      { label: 'Dhow VIP', value: yacht.dhowVip299_rate },
      { label: 'OE Child', value: yacht.oeChild129_rate },
      { label: 'OE Food', value: yacht.oeFood149_rate },
      { label: 'OE Drinks', value: yacht.oeDrinks249_rate },
      { label: 'OE VIP', value: yacht.oeVip349_rate },
      { label: 'Sunset Child', value: yacht.sunsetChild179_rate },
      { label: 'Sunset Food', value: yacht.sunsetFood199_rate },
      { label: 'Sunset Drinks', value: yacht.sunsetDrinks299_rate },
      { label: 'Lotus Food', value: yacht.lotusFood249_rate },
      { label: 'Lotus Drinks', value: yacht.lotusDrinks349_rate },
      { label: 'Lotus VIP (399)', value: yacht.lotusVip399_rate },
      { label: 'Lotus VIP (499)', value: yacht.lotusVip499_rate },
      { label: 'Others/Cake', value: yacht.othersAmtCake_rate },
    ];
    const definedCosts = costs.filter(cost => typeof cost.value === 'number' && cost.value > 0);
    if (definedCosts.length === 0) return <div className="text-sm text-muted-foreground">No specific package rates defined.</div>;

    return definedCosts.map(cost => (
      <div key={cost.label} className="text-sm">{cost.label}: {cost.value?.toLocaleString()} AED</div>
    ));
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Yacht Management"
        description="View and manage your fleet of yachts."
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
            <CardContent className="flex-grow space-y-3"> {/* Increased space-y slightly for better separation */}
              {/* Status badge and icon removed from here */}
              <div>
                <h4 className="text-md font-semibold text-foreground mb-1">Package Rates:</h4>
                <div className="space-y-1 text-muted-foreground">
                  {renderPackageCosts(yacht)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 mt-auto pt-4 border-t"> {/* Added border-t for visual separation */}
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
