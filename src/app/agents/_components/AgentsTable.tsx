
'use client';

import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type { Agent } from '@/lib/types';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface AgentsTableProps {
  agents: Agent[];
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agentId: string) => void;
  isAdmin: boolean; // Retained for backward compatibility/superuser checks
  canEdit?: boolean;
  canDelete?: boolean;
  selectedAgentIds: string[];
  onSelectAgent: (agentId: string, isSelected: boolean) => void;
  onSelectAllAgents: (isSelected: boolean) => void;
}

export function AgentsTable({
  agents,
  onEditAgent,
  onDeleteAgent,
  isAdmin,
  canEdit = false,
  canDelete = false,
  selectedAgentIds,
  onSelectAgent,
  onSelectAllAgents
}: AgentsTableProps) {

  const getStatusBadgeVariant = (status: Agent['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Non Active':
        return 'secondary';
      case 'Dead':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const truncateText = (text?: string, maxLength: number = 20) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  };

  const isAllSelected = agents.length > 0 && selectedAgentIds.length === agents.length;
  const isSomeSelected = selectedAgentIds.length > 0 && selectedAgentIds.length < agents.length;


  return (
    <ScrollArea className="rounded-md border whitespace-nowrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                aria-label="Select all agents"
                checked={isAllSelected}
                onCheckedChange={(checked) => onSelectAllAgents(Boolean(checked))}
                disabled={!isAdmin || agents.length === 0}
                data-state={isSomeSelected ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Agency Code</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone No</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>TRN Number</TableHead>
            <TableHead>Customer Type ID</TableHead>
            <TableHead>Discount (%)</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="h-24 text-center">
                No agents found.
              </TableCell>
            </TableRow>
          ) : (
            agents.map((agent) => (
              <TableRow
                key={agent.id}
                data-state={selectedAgentIds.includes(agent.id) ? "selected" : ""}
              >
                <TableCell>
                  <Checkbox
                    aria-label={`Select agent ${agent.name}`}
                    checked={selectedAgentIds.includes(agent.id)}
                    onCheckedChange={(checked) => onSelectAgent(agent.id, Boolean(checked))}
                    disabled={!canDelete && !isAdmin}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => (canEdit || isAdmin) && onEditAgent(agent)}
                    disabled={!canEdit && !isAdmin}
                  >
                    {truncateText(agent.id, 10)}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.agency_code || '-'}</TableCell>
                <TableCell>{truncateText(agent.address, 25)}</TableCell>
                <TableCell>{agent.phone_no || '-'}</TableCell>
                <TableCell>{agent.email}</TableCell>
                <TableCell>{agent.TRN_number || '-'}</TableCell>
                <TableCell>{agent.customer_type_id || '-'}</TableCell>
                <TableCell>{agent.discount.toFixed(1)}%</TableCell>
                <TableCell>
                  {agent.websiteUrl ? (
                    <a href={agent.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Link
                    </a>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(agent.status)}>{agent.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={(!canEdit && !canDelete) && !isAdmin}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEditAgent(agent)} disabled={!canEdit && !isAdmin}>
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log('View agent details (not implemented)', agent.id)}>View Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteAgent(agent.id)}
                        disabled={!canDelete && !isAdmin}
                      >
                        Delete Agent
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
