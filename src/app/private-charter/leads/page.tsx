
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PCLeadsTable } from './_components/PCLeadsTable';
import { PCLeadForm } from './_components/PCLeadForm';
import { PCLead } from '@/lib/pc-types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function PCLeadsPage() {
    const [leads, setLeads] = useState<PCLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<PCLead | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/private-charter/leads');
            if (res.ok) {
                setLeads(await res.json());
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch leads', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleCreateNew = () => {
        setEditingLead(null);
        setIsFormOpen(true);
    };

    const handleEdit = (lead: PCLead) => {
        setEditingLead(lead);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            const res = await fetch(`/api/private-charter/leads/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast({ title: 'Deleted', description: 'Lead removed successfully' });
                fetchLeads();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete lead', variant: 'destructive' });
        }
    };

    const handleSubmit = async (values: any) => {
        try {
            const method = values.id ? 'PUT' : 'POST';
            const url = values.id ? `/api/private-charter/leads/${values.id}` : '/api/private-charter/leads';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                toast({
                    title: values.id ? 'Updated' : 'Created',
                    description: `Lead ${values.id ? 'updated' : 'created'} successfully`
                });
                setIsFormOpen(false);
                fetchLeads();
            } else {
                throw new Error('Failed to save lead');
            }
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        }
    };

    const filteredLeads = leads.filter(l =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone.includes(searchTerm) ||
        l.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Lead Management</h1>
                    <p className="text-slate-500 mt-1">Track and manage premium private charter inquiries.</p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-5 w-5" /> New Lead
                </Button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, email or phone..."
                        className="pl-10 h-11 bg-white border-slate-200 focus:ring-blue-500 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-11 rounded-xl px-5 border-slate-200 text-slate-600">
                    <Filter className="mr-2 h-4 w-4" /> Filters
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            ) : (
                <PCLeadsTable
                    leads={filteredLeads}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <PCLeadForm
                isOpen={isFormOpen}
                onOpenChange={setIsFormOpen}
                lead={editingLead}
                onSubmit={handleSubmit}
            />
        </div>
    );
}
