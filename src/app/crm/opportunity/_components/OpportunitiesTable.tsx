
'use client';

import { useMemo } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Opportunity, OpportunityPipelinePhase } from '@/lib/types';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { format, parseISO, isValid } from 'date-fns';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  onEditOpportunity: (opportunity: Opportunity) => void;
  onDeleteOpportunity: (opportunityId: string) => void;
  userMap: { [id: string]: string };
  yachtMap: { [id: string]: string };
}

export function OpportunitiesTable({
  opportunities,
  onEditOpportunity,
  onDeleteOpportunity,
  userMap,
  yachtMap,
}: OpportunitiesTableProps) {

  const getPhaseBadgeVariant = (phase: OpportunityPipelinePhase) => {
    switch (phase) {
      case 'New': return 'secondary';
      case 'Qualification': return 'outline';
      case 'Proposal': return 'default';
      case 'Negotiation': return 'default';
      case 'Closed Won': return 'default';
      case 'Closed Lost': return 'destructive';
      default: return 'outline';
    }
  };
  
  const formatCurrency = (amount?: number | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '-';
    return `${amount.toLocaleString()} AED`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'dd MMM, yyyy') : dateString;
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollArea className="rounded-md border whitespace-nowrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Potential Customer</TableHead>
            <TableHead>Est. Closing</TableHead>
            <TableHead>Est. Revenue</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Yacht</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                No opportunities found.
              </TableCell>
            </TableRow>
          ) : (
            opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell>
                  <Button variant="link" className="p-0 h-auto font-medium" onClick={() => onEditOpportunity(opp)}>
                    {opp.id}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{opp.potentialCustomer}</TableCell>
                <TableCell>{formatDate(opp.estimatedClosingDate)}</TableCell>
                <TableCell>{formatCurrency(opp.estimatedRevenue)}</TableCell>
                <TableCell>
                  <Badge variant={getPhaseBadgeVariant(opp.pipelinePhase)}>{opp.pipelinePhase}</Badge>
                </TableCell>
                <TableCell>{userMap[opp.ownerUserId] || opp.ownerUserId}</TableCell>
                <TableCell>{yachtMap[opp.yachtId] || opp.yachtId}</TableCell>
                <TableCell>{opp.priority}</TableCell>
                <TableCell>{opp.currentStatus}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEditOpportunity(opp)}>Edit Opportunity</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteOpportunity(opp.id)}
                      >
                        Delete Opportunity
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
