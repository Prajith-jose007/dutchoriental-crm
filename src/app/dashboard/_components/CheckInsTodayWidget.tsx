
'use client';

import { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Lead, Yacht } from '@/lib/types';
import { isToday, parseISO, isValid, format } from 'date-fns';
import { Anchor, Clock } from 'lucide-react';

interface CheckInsTodayWidgetProps {
    leads: Lead[];
    yachts: Yacht[];
}

export function CheckInsTodayWidget({ leads, yachts }: CheckInsTodayWidgetProps) {
    const todaysTrips = useMemo(() => {
        return leads.filter(lead => {
            const eventDate = parseISO(lead.month);
            return isValid(eventDate) && isToday(eventDate) && (lead.status === 'Confirmed' || lead.status === 'Checked In');
        }).sort((a, b) => a.month.localeCompare(b.month));
    }, [leads]);

    const getYachtName = (id: string) => yachts.find(y => y.id === id)?.name || id;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle className="text-lg">Check-ins Today</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[400px]">
                {todaysTrips.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground italic">
                        No check-ins scheduled for today.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todaysTrips.map((trip) => (
                            <div key={trip.id} className="p-3 bg-muted/40 rounded-lg flex items-center justify-between group hover:bg-muted transition-colors">
                                <div className="min-w-0">
                                    <p className="font-bold truncate text-sm">{trip.clientName}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(parseISO(trip.month), 'HH:mm')}</span>
                                        <span className="flex items-center gap-1 font-semibold text-primary"><Anchor className="h-3 w-3" /> {getYachtName(trip.yacht)}</span>
                                    </div>
                                </div>
                                <Badge variant={trip.status === 'Checked In' ? 'default' : 'outline'} className={trip.status === 'Checked In' ? 'bg-green-600' : ''}>
                                    {trip.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
