import Image from 'next/image';
import { Ship, Zap, Wrench } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { placeholderYachts } from '@/lib/placeholder-data';
import type { Yacht } from '@/lib/types';

export function YachtList() {
  const yachts: Yacht[] = placeholderYachts.slice(0, 3); // Display a few yachts

  const getStatusBadgeVariant = (status: Yacht['status']) => {
    switch (status) {
      case 'Available':
        return 'default'; // Greenish or primary
      case 'Booked':
        return 'secondary'; // Bluish or muted
      case 'Maintenance':
        return 'destructive'; // Reddish
      default:
        return 'outline';
    }
  };
  
  const getStatusIcon = (status: Yacht['status']) => {
    switch (status) {
      case 'Available':
        return <Zap className="mr-1 h-3 w-3 text-green-500" />;
      case 'Booked':
        return <Ship className="mr-1 h-3 w-3 text-blue-500" />;
      case 'Maintenance':
        return <Wrench className="mr-1 h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>Yacht Fleet Overview</CardTitle>
        <CardDescription>Quick view of some of your yachts.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        {yachts.map((yacht) => (
          <div key={yacht.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Image
              alt={yacht.name}
              className="rounded-lg object-cover"
              height="64"
              src={yacht.imageUrl || `https://placehold.co/64x64.png`}
              data-ai-hint="yacht luxury"
              style={{
                aspectRatio: "64/64",
                objectFit: "cover",
              }}
              width="64"
            />
            <div className="grid gap-1 text-sm">
              <div className="font-semibold">{yacht.name}</div>
              <div>Capacity: {yacht.capacity} guests</div>
            </div>
            <Badge variant={getStatusBadgeVariant(yacht.status)} className="ml-auto whitespace-nowrap flex items-center">
              {getStatusIcon(yacht.status)}
              {yacht.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
