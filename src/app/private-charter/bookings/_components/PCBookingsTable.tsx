
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
import { MoreHorizontal, MapPin, Users, Clock, Info } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PCBooking, PCBookingStatus } from '@/lib/pc-types';
import { format, parseISO, isValid } from 'date-fns';

interface PCBookingsTableProps {
    bookings: PCBooking[];
    onView: (booking: PCBooking) => void;
    onStatusChange: (id: string, status: PCBookingStatus) => void;
}

export function PCBookingsTable({ bookings, onView, onStatusChange }: PCBookingsTableProps) {

    const getStatusVariant = (status: PCBookingStatus) => {
        switch (status) {
            case 'Tentative': return 'secondary';
            case 'Confirmed': return 'success';
            case 'Completed': return 'default';
            case 'Cancelled': return 'destructive';
            case 'No-show': return 'warning';
            default: return 'outline';
        }
    };

    return (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Trip Date & Time</TableHead>
                        <TableHead>Yacht & Location</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bookings.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                No confirmed private charter bookings found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        bookings.map((booking) => (
                            <TableRow key={booking.id} className="hover:bg-muted/30">
                                <TableCell className="font-mono text-xs font-bold text-slate-500">
                                    {booking.id}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">
                                            {booking.tripDate}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {booking.startTime} - {booking.endTime} ({booking.totalHours}h)
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{booking.yachtId}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {booking.location}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        {booking.guestsCount}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(booking.status) as any}>
                                        {booking.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onView(booking)}>
                                                <Info className="mr-2 h-4 w-4" /> Trip Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onStatusChange(booking.id, 'Confirmed')}>
                                                Mark Confirmed
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => onStatusChange(booking.id, 'Completed')}>
                                                Mark Completed
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
