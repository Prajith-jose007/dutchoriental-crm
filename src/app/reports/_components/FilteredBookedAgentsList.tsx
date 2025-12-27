
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Lead, Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase } from 'lucide-react';

interface FilteredAgentBookingInfo {
  agentId: string;
  agentName: string;
  closedBookingsCount: number;
}

interface FilteredBookedAgentsListProps {
  filteredLeads: Lead[];
  allAgents: Agent[]; // To map agent IDs to names
  isLoading?: boolean;
  error?: string | null;
}

export function FilteredBookedAgentsList({ filteredLeads, allAgents, isLoading, error }: FilteredBookedAgentsListProps) {
  const agentBookingData: FilteredAgentBookingInfo[] = useMemo(() => {
    const agentMap = new Map(allAgents.map(agent => [agent.id, agent.name]));
    const bookingsByAgent = new Map<string, number>();

    filteredLeads.forEach(lead => {
      if (lead.status === 'Confirmed' && lead.agent) {
        bookingsByAgent.set(lead.agent, (bookingsByAgent.get(lead.agent) || 0) + 1);
      }
    });

    return Array.from(bookingsByAgent.entries())
      .map(([agentId, count]) => ({
        agentId,
        agentName: agentMap.get(agentId) || `Unknown (ID: ${agentId.substring(0, 6)})`,
        closedBookingsCount: count,
      }))
      .filter(item => item.closedBookingsCount > 0) // Only show agents with closed bookings
      .sort((a, b) => b.closedBookingsCount - a.closedBookingsCount);
  }, [filteredLeads, allAgents]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Confirmed Bookings (Filtered)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-5 w-1/5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Confirmed Bookings (Filtered)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading agent data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (agentBookingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Confirmed Bookings (Filtered)</CardTitle>
          <CardDescription>Agents with &apos;Confirmed&apos; bookings based on current filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No agents found with &apos;Confirmed&apos; bookings matching the current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Confirmed Bookings (Filtered)</CardTitle>
        <CardDescription>Agents with &apos;Confirmed&apos; bookings based on current filters.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead className="text-right">Confirmed Bookings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentBookingData.map(agentInfo => (
              <TableRow key={agentInfo.agentId}>
                <TableCell className="font-medium">{agentInfo.agentName}</TableCell>
                <TableCell className="text-right">{agentInfo.closedBookingsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
