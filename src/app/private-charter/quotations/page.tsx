
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, FileSpreadsheet, Download, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PCQuotation, PCLead, PCYacht } from '@/lib/pc-types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PCQuotationForm } from './_components/PCQuotationForm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function PCQuotationsPage() {
    const [quotations, setQuotations] = useState<PCQuotation[]>([]);
    const [leads, setLeads] = useState<PCLead[]>([]);
    const [yachts, setYachts] = useState<PCYacht[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<PCQuotation | null>(null);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [qRes, lRes, yRes] = await Promise.all([
                fetch('/api/private-charter/quotations'),
                fetch('/api/private-charter/leads'),
                fetch('/api/private-charter/yachts')
            ]);
            if (qRes.ok) setQuotations(await qRes.json());
            if (lRes.ok) setLeads(await lRes.json());
            if (yRes.ok) setYachts(await yRes.json());
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateNew = () => {
        setEditingQuotation(null);
        setIsFormOpen(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            const method = values.id ? 'PUT' : 'POST';
            const url = values.id ? `/api/private-charter/quotations/${values.id}` : '/api/private-charter/quotations';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                toast({ title: 'Success', description: `Quotation ${values.id ? 'updated' : 'created'} successfully` });
                setIsFormOpen(false);
                fetchData();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save quotation', variant: 'destructive' });
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quotations</h1>
                    <p className="text-slate-500 mt-1">Manage and send premium charter quotes to clients.</p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 h-12 rounded-xl shadow-lg transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" /> Create Quotation
                </Button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search quotations..."
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                    />
                </div>
                <Button variant="outline" className="h-11 rounded-xl"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
            </div>

            {isLoading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
            ) : (
                <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Quote Ref</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Yacht</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Total Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quotations.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No quotations found.</TableCell></TableRow>
                            ) : (
                                quotations.map((q) => {
                                    const lead = leads.find(l => l.id === q.leadId);
                                    const yacht = yachts.find(y => y.id === q.yachtId);
                                    return (
                                        <TableRow key={q.id}>
                                            <TableCell className="font-mono text-xs font-bold text-slate-500">{q.id}</TableCell>
                                            <TableCell className="font-medium">{lead ? `${lead.firstName} ${lead.lastName}` : q.leadId}</TableCell>
                                            <TableCell>{yacht ? yacht.name : q.yachtId}</TableCell>
                                            <TableCell>{q.durationHours}h</TableCell>
                                            <TableCell className="font-bold text-blue-600">${q.totalAmount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={q.status === 'Accepted' ? 'success' : q.status === 'Draft' ? 'secondary' : 'default' as any}>
                                                    {q.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="sm" onClick={() => { setEditingQuotation(q); setIsFormOpen(true); }}><FileSpreadsheet className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <PCQuotationForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                quotation={editingQuotation}
                leads={leads}
                yachts={yachts}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
