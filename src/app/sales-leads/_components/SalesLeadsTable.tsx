
'use client';

import { SalesLead } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Mail, Phone, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isValid } from 'date-fns';

interface SalesLeadsTableProps {
    leads: SalesLead[];
    onEdit: (lead: SalesLead) => void;
    onDelete: (id: string) => void;
}

export function SalesLeadsTable({ leads, onEdit, onDelete }: SalesLeadsTableProps) {
    const getStatusBadge = (status: SalesLead['status']) => {
        const variants: Record<string, string> = {
            New: 'bg-blue-100 text-blue-700',
            Contacted: 'bg-yellow-100 text-yellow-700',
            Qualified: 'bg-indigo-100 text-indigo-700',
            Converted: 'bg-green-100 text-green-700',
            Lost: 'bg-red-100 text-red-700',
        };
        return <Badge className={variants[status] || 'bg-slate-100'}>{status}</Badge>;
    };

    const getPriorityBadge = (priority: SalesLead['priority']) => {
        const variants: Record<string, string> = {
            High: 'bg-red-50 text-red-600 border-red-100',
            Medium: 'bg-orange-50 text-orange-600 border-orange-100',
            Low: 'bg-slate-50 text-slate-600 border-slate-100',
        };
        return <Badge variant="outline" className={variants[priority]}>{priority}</Badge>;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead>Client & Contact</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Date & Guests</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-64 text-center text-slate-500">
                                No sales leads found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        leads.map((lead) => (
                            <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-semibold text-slate-900">{lead.clientName}</span>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-medium text-slate-700">{lead.subject}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            {lead.preferredDate && isValid(parseISO(lead.preferredDate))
                                                ? format(parseISO(lead.preferredDate), 'dd MMM yyyy')
                                                : 'Not set'}
                                        </span>
                                        <span className="text-xs flex items-center gap-1">
                                            <Users className="h-3 w-3 text-slate-400" />
                                            {lead.paxCount || 0} Guests
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
                                        {lead.source}
                                    </Badge>
                                </TableCell>
                                <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                <TableCell>{getPriorityBadge(lead.priority)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => onEdit(lead)} className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => onDelete(lead.id)} className="h-8 w-8 text-slate-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
