
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
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useUserRole } from '@/hooks/use-user-role';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2 } from 'lucide-react';

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
  const { hasPermission } = useUserRole();
  const { toast } = useToast();
  const canAllocatePayment = hasPermission('manage_accounts') || hasPermission('manage_users'); // Adjust permission as needed

  const [paymentInputs, setPaymentInputs] = useState<{ [agentId: string]: string }>({});
  const [isAllocating, setIsAllocating] = useState<{ [agentId: string]: boolean }>({});

  const handleAllocatePayment = async (agentId: string) => {
    const amountStr = paymentInputs[agentId];
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }

    setIsAllocating(prev => ({ ...prev, [agentId]: true }));
    try {
      const response = await fetch(`/api/agents/${agentId}/allocate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error('Failed to allocate payment');
      }

      const result = await response.json();
      toast({
        title: "Payment Allocated",
        description: `Successfully allocated AED ${result.allocated.toFixed(2)} across outstanding bookings.`
      });

      // Clear input
      setPaymentInputs(prev => ({ ...prev, [agentId]: '' }));

      // Ideally, we should refresh the data here. 
      // Since data comes from props, we might need to trigger a parent refresh or reload.
      // For a quick fix, we reload window or wait for parent SWR revalidation if applicable.
      // Assuming parent fetches on mount or via simple poll? 
      // The prop `filteredLeads` needs to update.
      window.location.reload(); // Simple but effective for report updates

    } catch (err) {
      console.error(err);
      toast({ title: "Allocation Failed", description: "Could not process payment allocation.", variant: "destructive" });
    } finally {
      setIsAllocating(prev => ({ ...prev, [agentId]: false }));
    }
  };
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(agentBookingData.length / itemsPerPage);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return agentBookingData.slice(start, start + itemsPerPage);
  }, [agentBookingData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [agentBookingData]);

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
          <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Agent Sales Performance (Filtered)</CardTitle>
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
              {canAllocatePayment && <TableHead className="text-right">Payment Allocation</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map(agentInfo => (
              <TableRow key={agentInfo.agentId}>
                <TableCell className="font-medium">{agentInfo.agentName}</TableCell>
                <TableCell className="text-center">{agentInfo.closedBookingsCount}</TableCell>
                <TableCell className="text-right font-medium">AED {agentInfo.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">AED {agentInfo.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right text-green-600">AED {agentInfo.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className={`text-right ${agentInfo.balance > 0 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  AED {agentInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                {canAllocatePayment && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Input
                        placeholder="Amount"
                        type="number"
                        className="w-24 h-8 text-right"
                        value={paymentInputs[agentInfo.agentId] || ''}
                        onChange={(e) => setPaymentInputs(prev => ({ ...prev, [agentInfo.agentId]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2"
                        disabled={!paymentInputs[agentInfo.agentId] || isAllocating[agentInfo.agentId]}
                        onClick={() => handleAllocatePayment(agentInfo.agentId)}
                      >
                        {isAllocating[agentInfo.agentId] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground uppercase">
              Page {currentPage} of {totalPages}
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
