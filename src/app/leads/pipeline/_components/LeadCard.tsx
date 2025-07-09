
'use client';

import type { Lead } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ship, User, CalendarDays, CircleDollarSign } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onEditLead: (lead: Lead) => void; // Added prop for handling edit/view
}

export function LeadCard({ lead, onEditLead }: LeadCardProps) {
  const formatCurrency = (amount: number | undefined | null) => {
    if (typeof amount !== 'number') return 'N/A';
    return `${amount.toLocaleString()} AED`;
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{lead.clientName}</CardTitle>
        <CardDescription className="text-xs">{lead.type} - Booking ID: {lead.id && lead.id.length > 8 ? lead.id.substring(0, 8) + '...' : lead.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm pb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Ship className="h-4 w-4" /> 
          <span>Yacht: {lead.yacht && lead.yacht.length > 15 ? lead.yacht.substring(0,12) + "..." : lead.yacht}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Agent: {lead.agent && lead.agent.length > 15 ? lead.agent.substring(0,12) + "..." : lead.agent}</span>
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
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => onEditLead(lead)} // Call onEditLead when button is clicked
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
