
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

interface AgentBookingInfo {
  agentId: string;
  agentName: string;
  closedBookingsCount: number;
}

interface BookedAgentsListProps {
  leads: Lead[];
  allAgents: Agent[];
  isLoading?: boolean;
  error?: string | null;
}

export function BookedAgentsList({ leads, allAgents, isLoading, error }: BookedAgentsListProps) {
  const agentBookingData: AgentBookingInfo[] = useMemo(() => {
    const agentMap = new Map(allAgents.map(agent => [agent.id, agent.name]));
    const bookingsByAgent = new Map<string, number>();

    leads.forEach(lead => {
      if (lead.status.startsWith('Closed') && lead.agent) {
        bookingsByAgent.set(lead.agent, (bookingsByAgent.get(lead.agent) || 0) + 1);
      }
    });

    return Array.from(bookingsByAgent.entries())
      .map(([agentId, count]) => ({
        agentId,
        agentName: agentMap.get(agentId) || `Unknown Agent (ID: ${agentId.substring(0,6)}...)`,
        closedBookingsCount: count,
      }))
      .sort((a, b) => b.closedBookingsCount - a.closedBookingsCount);
  }, [leads, allAgents]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Closed Bookings</CardTitle>
          <CardDescription>Top performing agents by closed bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
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
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Closed Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error loading agent booking data: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (agentBookingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Closed Bookings</CardTitle>
          <CardDescription>Top performing agents by closed bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No agents found with closed bookings for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agents with Closed Bookings</CardTitle>
        <CardDescription>Agents ranked by number of 'Closed' bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead className="text-right">Closed Bookings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentBookingData.slice(0, 10).map(agentInfo => ( // Show top 10 or adjust as needed
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
