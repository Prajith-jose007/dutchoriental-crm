
'use client';

import { useMemo } from 'react';
import {
    Users,
    Target,
    CheckCircle2,
    Clock,
    DollarSign,
    Anchor,
    AlertCircle
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Lead } from '@/lib/types';
import {
    isToday,
    isThisWeek,
    parseISO,
    isValid,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    addDays,
    startOfDay,
    endOfDay
} from 'date-fns';

interface ManagementKPIsProps {
    leads: Lead[];
    isLoading?: boolean;
}

export function ManagementKPIs({ leads, isLoading }: ManagementKPIsProps) {
    const kpis = useMemo(() => {
        const now = new Date();
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const next7DaysEnd = endOfDay(addDays(now, 7));
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const stats = {
            totalLeads: leads.length,
            newLeadsToday: 0,
            newLeadsWeek: 0,
            confirmedBookings: 0,
            pendingPaymentsNum: 0,
            dailyRevenue: 0,
            monthlyRevenue: 0,
            upcomingTripsToday: 0,
            upcomingTripsWeek: 0,
            cancelledNoShow: 0,
            checkInsToday: 0,
        };

        leads.forEach(lead => {
            const createdDate = parseISO(lead.createdAt);
            const eventDate = parseISO(lead.month);

            // New Leads
            if (isValid(createdDate)) {
                if (isToday(createdDate)) stats.newLeadsToday++;
                if (isThisWeek(createdDate)) stats.newLeadsWeek++;
            }

            // Status filters
            if (lead.status === 'Confirmed' || lead.status === 'Checked In' || lead.status === 'Completed') {
                stats.confirmedBookings++;
            }

            if (lead.status === 'Lost' || lead.status === 'Balance') {
                // This is a bit subjective, usually 'Lost' or some other state
            }

            // Revenue (Closed/Completed)
            if (lead.status === 'Confirmed' || lead.status === 'Checked In' || lead.status === 'Completed') {
                if (isValid(eventDate)) {
                    if (isToday(eventDate)) stats.dailyRevenue += lead.netAmount;
                    if (isWithinInterval(eventDate, { start: monthStart, end: monthEnd })) stats.monthlyRevenue += lead.netAmount;
                }
            }

            // Upcoming Trips
            if (isValid(eventDate) && (lead.status === 'Confirmed')) {
                if (isToday(eventDate)) stats.upcomingTripsToday++;
                if (isWithinInterval(eventDate, { start: todayStart, end: next7DaysEnd })) stats.upcomingTripsWeek++;
            }

            // Payments
            if (lead.balanceAmount > 0) {
                stats.pendingPaymentsNum++;
            }

            // Operation
            if (lead.checkInStatus === 'Checked In' && isValid(eventDate) && isToday(eventDate)) {
                stats.checkInsToday++;
            }
        });

        return stats;
    }, [leads]);

    const cards = [
        {
            title: 'Total Leads',
            value: kpis.totalLeads,
            description: 'Lifetime database total',
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
        },
        {
            title: 'New Leads',
            value: kpis.newLeadsToday,
            description: `Today / ${kpis.newLeadsWeek} This Week`,
            icon: <Target className="h-4 w-4 text-primary" />,
        },
        {
            title: 'Confirmed Bookings',
            value: kpis.confirmedBookings,
            description: 'Active confirmed events',
            icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        },
        {
            title: 'Revenue Today',
            value: `AED ${kpis.dailyRevenue.toLocaleString()}`,
            description: `AED ${kpis.monthlyRevenue.toLocaleString()} this month`,
            icon: <DollarSign className="h-4 w-4 text-green-600" />,
        },
        {
            title: 'Upcoming Trips',
            value: kpis.upcomingTripsToday,
            description: `${kpis.upcomingTripsWeek} in next 7 days`,
            icon: <Anchor className="h-4 w-4 text-blue-600" />,
        },
        {
            title: 'Pending Payments',
            value: kpis.pendingPaymentsNum,
            description: 'Bookings with balance due',
            icon: <Clock className="h-4 w-4 text-orange-600" />,
        },
        {
            title: 'Check-ins Today',
            value: kpis.checkInsToday,
            description: 'Guests arrived today',
            icon: <AlertCircle className="h-4 w-4 text-purple-600" />,
        }
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
