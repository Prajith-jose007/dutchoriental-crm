
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Search, Calendar, MapPin, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PCBooking, PCBookingStatus } from '@/lib/pc-types';
import { PCBookingsTable } from './_components/PCBookingsTable';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function PCBookingsPage() {
    const [bookings, setBookings] = useState<PCBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/private-charter/bookings');
            if (res.ok) {
                setBookings(await res.json());
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch bookings', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusChange = async (id: string, status: PCBookingStatus) => {
        try {
            const res = await fetch(`/api/private-charter/bookings/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                toast({ title: 'Success', description: `Booking marked as ${status}` });
                fetchBookings();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Booking Management</h1>
                    <p className="text-slate-500 mt-1">Operational view of all confirmed private charter trips.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 rounded-xl px-6 border-slate-200">
                        <Calendar className="mr-2 h-5 w-5" /> Schedule View
                    </Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-12 rounded-xl shadow-lg transition-all active:scale-95">
                        <Plus className="mr-2 h-5 w-5" /> Manual Booking
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by Booking ID, Yacht or Customer..."
                        className="pl-10 h-11 bg-white border-slate-200 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-11 rounded-xl px-5"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            ) : (
                <PCBookingsTable
                    bookings={bookings}
                    onView={(b) => console.log('View', b)}
                    onStatusChange={handleStatusChange}
                />
            )}
        </div>
    );
}
