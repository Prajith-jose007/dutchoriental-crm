
'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MoreHorizontal, Phone, Mail, Calendar, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { PCLead, PCLeadStatus, PCLeadPriority } from '@/lib/pc-types';
import { format, parseISO, isValid } from 'date-fns';

interface PCLeadsTableProps {
    leads: PCLead[];
    onEdit: (lead: PCLead) => void;
    onDelete: (id: string) => void;
}

export function PCLeadsTable({ leads, onEdit, onDelete }: PCLeadsTableProps) {

    const getStatusVariant = (status: PCLeadStatus) => {
        switch (status) {
            case 'New': return 'secondary';
            case 'Contacted': return 'outline';
            case 'Follow-up': return 'default';
            case 'Quoted': return 'secondary';
            case 'Negotiation': return 'warning';
            case 'Confirmed': return 'success';
            case 'Lost': return 'destructive';
            default: return 'outline';
        }
    };

    const getPriorityVariant = (priority: PCLeadPriority) => {
        switch (priority) {
            case 'High': return 'destructive';
            case 'Medium': return 'default';
            case 'Low': return 'secondary';
            default: return 'outline';
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = parseISO(dateStr);
        return isValid(date) ? format(date, 'dd MMM yyyy') : '-';
    };

    return (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Inquiry Date</TableHead>
                        <TableHead>Preferred Trip</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                No private charter leads found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        leads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground">
                                            {lead.firstName} {lead.lastName}
                                        </span>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> {lead.phone}
                                            </span>
                                            {lead.email && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" /> {lead.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {formatDate(lead.inquiryDate)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{lead.yachtType || 'Any Yacht'}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {lead.durationHours}h • {formatDate(lead.preferredDate)}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(lead.status) as any} className="font-medium">
                                        {lead.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getPriorityVariant(lead.priority) as any} className="bg-opacity-10 font-medium">
                                        {lead.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm">{lead.assignedAgentId || 'Unassigned'}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel>Manage Lead</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onEdit(lead)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-blue-600">
                                                <Calendar className="mr-2 h-4 w-4" /> Schedule Call
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:bg-destructive/10"
                                                onClick={() => onDelete(lead.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Lead
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
