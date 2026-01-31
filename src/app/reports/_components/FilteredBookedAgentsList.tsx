
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
  totalSale: number;
  netAmount: number;
  paidAmount: number;
  balance: number;
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
    const dataByAgent = new Map<string, { count: number; totalSale: number; netNum: number; paidNum: number; balNum: number }>();

    filteredLeads.forEach(lead => {
      // Include all statuses that imply a valid booking/sale
      const validStatuses = ['Confirmed', 'Balance', 'Paid', 'Completed', 'Closed (Won)'];
      if (validStatuses.includes(lead.status) && lead.agent) {
        const current = dataByAgent.get(lead.agent) || { count: 0, totalSale: 0, netNum: 0, paidNum: 0, balNum: 0 };
        dataByAgent.set(lead.agent, {
          count: current.count + 1,
          totalSale: current.totalSale + (Number(lead.totalAmount) || 0),
          netNum: current.netNum + (Number(lead.netAmount) || 0),
          paidNum: current.paidNum + (Number(lead.paidAmount) || 0),
          balNum: current.balNum + (Number(lead.balanceAmount) || 0),
        });
      }
    });

    return Array.from(dataByAgent.entries())
      .map(([agentId, data]) => ({
        agentId,
        agentName: agentMap.get(agentId) || `Unknown (ID: ${agentId.substring(0, 6)})`,
        closedBookingsCount: data.count,
        totalSale: data.totalSale,
        netAmount: data.netNum,
        paidAmount: data.paidNum,
        balance: data.balNum
      }))
      .sort((a, b) => b.totalSale - a.totalSale); // Sort by total sale value
  }, [filteredLeads, allAgents]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agent Sales Performance (Filtered)</CardTitle>
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
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agent Sales Performance (Filtered)</CardTitle>
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
          <p className="text-muted-foreground">No agent sales data found matching the current filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agent Sales Performance (Filtered)</CardTitle>
        <CardDescription>Sales metrics for confirmed/won bookings based on current filters.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Name</TableHead>
              <TableHead className="text-center">Bookings</TableHead>
              <TableHead className="text-right">Total Sale</TableHead>
              <TableHead className="text-right">Net Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentBookingData.map(agentInfo => (
              <TableRow key={agentInfo.agentId}>
                <TableCell className="font-medium">{agentInfo.agentName}</TableCell>
                <TableCell className="text-center">{agentInfo.closedBookingsCount}</TableCell>
                <TableCell className="text-right font-medium">AED {agentInfo.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">AED {agentInfo.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-green-600">AED {agentInfo.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className={`text-right ${agentInfo.balance > 0 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  AED {agentInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
