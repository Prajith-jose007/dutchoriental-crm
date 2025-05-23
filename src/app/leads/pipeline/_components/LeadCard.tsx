
'use client';

import type { Lead } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ship, User, CalendarDays, CircleDollarSign } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number') return 'N/A';
    return `${amount.toLocaleString()} AED`;
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{lead.clientName}</CardTitle>
        <CardDescription className="text-xs">{lead.type} - Lead ID: {lead.id.substring(0, 8)}...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm pb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Ship className="h-4 w-4" /> 
          <span>Yacht: {lead.yacht}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Agent: {lead.agent}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>Month: {lead.month}</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          <span>Total: {formatCurrency(lead.totalAmount)}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 border-t">
        {/* Add actions like "View Details" or "Edit" later if needed */}
        <Button variant="outline" size="sm" className="w-full" onClick={() => console.log("View/Edit Lead:", lead.id) /* Implement actual navigation or dialog open */}>
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
