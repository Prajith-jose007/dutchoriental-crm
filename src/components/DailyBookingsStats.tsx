
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lead, Yacht } from '@/lib/types';
import { format, parseISO, isValid, isSameDay } from 'date-fns';

interface DailyBookingsStatsProps {
    leads: Lead[];
    yachts: Yacht[];
    date?: Date;
    title?: string;
}

export function DailyBookingsStats({ leads, yachts, date = new Date(), title = "Daily Report" }: DailyBookingsStatsProps) {
    const stats = useMemo(() => {
        const targetDate = date;

        // Filter leads for the specific day
        const dayLeads = leads.filter(lead => {
            if (!lead.month) return false;
            try {
                const leadDate = parseISO(lead.month);
                return isValid(leadDate) && isSameDay(leadDate, targetDate);
            } catch {
                return false;
            }
        });

        const yachtStats: Record<string, {
            name: string;
            bookingsCount: number;
            totalPax: number;
            totalAmount: number;
            confirmedPax: number;
        }> = {};

        // Initialize yacht stats
        yachts.forEach(y => {
            yachtStats[y.id] = {
                name: y.name,
                bookingsCount: 0,
                totalPax: 0,
                totalAmount: 0,
                confirmedPax: 0
            };
        });

        // Aggregate data
        dayLeads.forEach(lead => {
            const yachtId = lead.yacht;
            // If yacht ID from lead is not in map (maybe name used instead of ID), try to find by name or create new entry
            let statsEntry = yachtStats[yachtId];

            if (!statsEntry) {
                // Try matching by name
                const foundYacht = yachts.find(y => y.name.toLowerCase() === yachtId.toLowerCase());
                if (foundYacht) {
                    statsEntry = yachtStats[foundYacht.id];
                } else {
                    // Create ad-hoc entry if yacht not found in list
                    yachtStats[yachtId] = {
                        name: yachtId,
                        bookingsCount: 0,
                        totalPax: 0,
                        totalAmount: 0,
                        confirmedPax: 0
                    };
                    statsEntry = yachtStats[yachtId];
                }
            }

            if (statsEntry) {
                statsEntry.bookingsCount += 1;

                // Calculate Pax
                let pax = 0;
                if (lead.packageQuantities) {
                    pax = lead.packageQuantities.reduce((sum, pq) => sum + (Number(pq.quantity) || 0), 0);
                }
                statsEntry.totalPax += pax;

                if (lead.status === 'Confirmed' || lead.paymentConfirmationStatus === 'CONFIRMED') {
                    statsEntry.confirmedPax += pax;
                }

                statsEntry.totalAmount += (lead.totalAmount || 0);
            }
        });

        // Convert to array and sort by recordings
        return Object.values(yachtStats)
            .filter(s => s.bookingsCount > 0) // Only show yachts with bookings? Or show all? User said "how much bookings", implies seeing the data. Showing 0 is informative too, but maybe clutter. Let's show only active ones for now to save space.
            .sort((a, b) => b.totalPax - a.totalPax);

    }, [leads, yachts, date]);

    const totalBookings = stats.reduce((acc, curr) => acc + curr.bookingsCount, 0);
    const totalguests = stats.reduce((acc, curr) => acc + curr.totalPax, 0);
    const totalRevenue = stats.reduce((acc, curr) => acc + curr.totalAmount, 0);

    return (
        <Card className="mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                    <span>{title} for {format(date, 'dd MMM yyyy')}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        Total: {totalBookings} Bkgs | {totalguests} Pax | {totalRevenue.toLocaleString()} AED
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {stats.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No bookings found for this date.</div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Yacht</TableHead>
                                    <TableHead className="text-center">Bookings</TableHead>
                                    <TableHead className="text-center">Total Pax</TableHead>
                                    <TableHead className="text-right">Revenue (AED)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stats.map((stat) => (
                                    <TableRow key={stat.name}>
                                        <TableCell className="font-medium">{stat.name}</TableCell>
                                        <TableCell className="text-center">{stat.bookingsCount}</TableCell>
                                        <TableCell className="text-center">{stat.totalPax}</TableCell>
                                        <TableCell className="text-right font-mono">{stat.totalAmount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
