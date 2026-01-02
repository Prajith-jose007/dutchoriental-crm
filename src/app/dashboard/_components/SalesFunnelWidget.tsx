
'use client';

import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type { Lead } from '@/lib/types';

interface SalesFunnelWidgetProps {
    leads: Lead[];
}

export function SalesFunnelWidget({ leads }: SalesFunnelWidgetProps) {
    const data = useMemo(() => {
        const stages = [
            { name: 'New', count: 0, color: '#94a3b8' },
            { name: 'Contacted', count: 0, color: '#60a5fa' },
            { name: 'Follow-up', count: 0, color: '#818cf8' },
            { name: 'Quoted', count: 0, color: '#a78bfa' },
            { name: 'Negotiation', count: 0, color: '#fbbf24' },
            { name: 'Confirmed', count: 0, color: '#22c55e' },
            { name: 'Completed', count: 0, color: '#10b981' },
            { name: 'Lost', count: 0, color: '#ef4444' },
        ];

        leads.forEach(lead => {
            const stage = stages.find(s => s.name === lead.status);
            if (stage) stage.count++;
            else if (lead.status === 'Checked In') {
                const comp = stages.find(s => s.name === 'Completed');
                if (comp) comp.count++;
            }
        });

        return stages;
    }, [leads]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Booking Pipeline</CardTitle>
                <CardDescription>Event distribution by status stage</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
