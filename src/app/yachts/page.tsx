import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { placeholderYachts } from '@/lib/placeholder-data';
import type { Yacht } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Zap, Wrench, Ship as ShipIcon } from 'lucide-react';

export default function YachtsPage() {
  const yachts: Yacht[] = placeholderYachts;

  const getStatusBadgeVariant = (status: Yacht['status']) => {
    switch (status) {
      case 'Available': return 'default';
      case 'Booked': return 'secondary';
      case 'Maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: Yacht['status']) => {
    switch (status) {
      case 'Available': return <Zap className="mr-1 h-3 w-3" />;
      case 'Booked': return <ShipIcon className="mr-1 h-3 w-3" />;
      case 'Maintenance': return <Wrench className="mr-1 h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Yacht Management"
        description="View and manage your fleet of yachts."
        actions={
          <Button>
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
            <CardContent className="flex-grow">
              <Badge variant={getStatusBadgeVariant(yacht.status)} className="flex items-center w-fit mb-2">
                {getStatusIcon(yacht.status)}
                {yacht.status}
              </Badge>
              <div className="space-y-1 text-sm text-muted-foreground">
                <h4 className="font-medium text-foreground">Package Costs:</h4>
                {typeof yacht.childPackageCost === 'number' && <div>Child: ${yacht.childPackageCost.toLocaleString()}</div>}
                {typeof yacht.adultPackageCost === 'number' && <div>Adult: ${yacht.adultPackageCost.toLocaleString()}</div>}
                {typeof yacht.vipPackageCost === 'number' && <div>VIP: ${yacht.vipPackageCost.toLocaleString()}</div>}
                {typeof yacht.vipAlcoholPackageCost === 'number' && <div>VIP Alcohol: ${yacht.vipAlcoholPackageCost.toLocaleString()}</div>}
                {typeof yacht.vipChildPackageCost === 'number' && <div>VIP Child: ${yacht.vipChildPackageCost.toLocaleString()}</div>}
                {typeof yacht.royalPackageCost === 'number' && <div>Royal: ${yacht.royalPackageCost.toLocaleString()}</div>}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 mt-auto pt-4"> {/* Added mt-auto and pt-4 for better spacing */}
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
