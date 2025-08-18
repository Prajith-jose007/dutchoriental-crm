
'use client';

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
import type { Agent } from '@/lib/types'; // Using Agent type for now
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ClientsTableProps {
  clients: Agent[];
  clientMap: { [id: string]: string };
  onEditClient: (client: Agent) => void;
  onDeleteClient: (clientId: string) => void;
  isAdmin: boolean;
}

export function ClientsTable({ 
  clients, 
  clientMap,
  onEditClient, 
  onDeleteClient, 
  isAdmin,
}: ClientsTableProps) {

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

  return (
    <ScrollArea className="rounded-md border whitespace-nowrap">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Parent Organization</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone No</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No clients found.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                    <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal" 
                        onClick={() => onEditClient(client)}
                    >
                        {truncateText(client.id, 10)}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.customer_type_id ? (clientMap[client.customer_type_id] || client.customer_type_id) : '-'}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone_no || '-'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(client.status)}>{client.status}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={!isAdmin}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEditClient(client)} disabled={!isAdmin}>
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteClient(client.id)}
                        disabled={!isAdmin}
                      >
                        Delete Client
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
