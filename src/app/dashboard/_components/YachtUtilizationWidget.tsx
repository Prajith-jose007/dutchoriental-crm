
'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Lead, Yacht } from '@/lib/types';
import { isThisWeek, parseISO, isValid } from 'date-fns';

interface YachtUtilizationWidgetProps {
    leads: Lead[];
    yachts: Yacht[];
}

export function YachtUtilizationWidget({ leads, yachts }: YachtUtilizationWidgetProps) {
    const data = useMemo(() => {
        const yachtStats = yachts.map(y => ({
            id: y.id,
            name: y.name,
            bookedSlots: 0,
            totalSlots: 14, // Assuming 2 slots per day (Morning/Evening) per week
        }));

        leads.forEach(lead => {
            if ((lead.status === 'Confirmed' || lead.status === 'Checked In' || lead.status === 'Completed') && isValid(parseISO(lead.month))) {
                if (isThisWeek(parseISO(lead.month))) {
                    const stat = yachtStats.find(s => s.id === lead.yacht);
                    if (stat) stat.bookedSlots++;
                }
            }
        });

        return yachtStats.map(s => ({
            name: s.name,
            utilization: Math.min(100, Math.round((s.bookedSlots / s.totalSlots) * 100))
        })).sort((a, b) => b.utilization - a.utilization);
    }, [leads, yachts]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Yacht Utilization</CardTitle>
                <CardDescription>% of slots booked this week (Based on 14 slots/wk)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis unit="%" />
                        <Tooltip
                            formatter={(value) => [`${value}%`, 'Utilization']}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="utilization" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
