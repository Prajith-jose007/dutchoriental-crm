
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, Ship, Users, Info, Edit, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PCYacht } from '@/lib/pc-types';

export default function PCYachtsPage() {
    const [yachts, setYachts] = useState<PCYacht[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchYachts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/private-charter/yachts');
            if (res.ok) setYachts(await res.json());
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch yachts', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchYachts();
    }, []);

    const filteredYachts = yachts.filter(y =>
        y.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        y.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yacht Inventory</h1>
                    <p className="text-slate-500 mt-1">Manage your premium fleet for private charters.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-12 rounded-xl shadow-lg transition-all active:scale-95">
                    <Plus className="mr-2 h-5 w-5" /> Add Yacht
                </Button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search yachts by name or category..."
                        className="pl-10 h-11 bg-white border-slate-200 focus:ring-blue-500 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredYachts.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                            <Ship className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-900">No Yachts Found</h3>
                            <p className="text-slate-500">Start by adding your first premium yacht to the inventory.</p>
                        </div>
                    ) : (
                        filteredYachts.map((yacht) => (
                            <Card key={yacht.id} className="group overflow-hidden border-none shadow-premium hover:shadow-premium-hover transition-all duration-500">
                                <div className="h-48 bg-slate-100 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                        <div className="flex gap-2 w-full">
                                            <Button size="sm" variant="secondary" className="flex-1 rounded-lg">View Details</Button>
                                            <Button size="sm" variant="secondary" className="w-10 h-10 p-0 rounded-lg"><Edit className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4 z-20">
                                        <Badge variant={(yacht.status === 'Available' ? 'success' : yacht.status === 'Booked' ? 'warning' : 'destructive') as any} className="shadow-sm">
                                            {yacht.status}
                                        </Badge>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Ship className="h-16 w-16 text-slate-300" />
                                    </div>
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">{yacht.name}</CardTitle>
                                            <p className="text-sm text-blue-600 font-medium">{yacht.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-slate-900">${yacht.pricePerHour}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Per Hour</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                                            <Users className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Capacity</p>
                                            <p className="text-sm font-bold text-slate-900">{yacht.capacity}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                                            <Info className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Cabins</p>
                                            <p className="text-sm font-bold text-slate-900">{yacht.cabinsCount}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                                            <Clock className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Min Hrs</p>
                                            <p className="text-sm font-bold text-slate-900">{yacht.minHours}h</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pb-6">
                                    <div className="flex flex-wrap gap-1">
                                        {yacht.amenities.slice(0, 3).map(a => (
                                            <span key={a} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">{a}</span>
                                        ))}
                                        {yacht.amenities.length > 3 && <span className="text-[10px] text-slate-400">+{yacht.amenities.length - 3} more</span>}
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
