
'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Users,
    Ship,
    Calendar,
    CreditCard,
    Target,
    TrendingUp,
    AlertCircle,
    Clock,
    Briefcase
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Sector
} from 'recharts';
import { PCLead, PCBooking } from '@/lib/pc-types';

export default function PCDashboardPage() {
    const [leads, setLeads] = useState<PCLead[]>([]);
    const [bookings, setBookings] = useState<PCBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [leadsRes, bookingsRes] = await Promise.all([
                    fetch('/api/private-charter/leads'),
                    fetch('/api/private-charter/bookings')
                ]);

                if (leadsRes.ok) setLeads(await leadsRes.json());
                // if (bookingsRes.ok) setBookings(await bookingsRes.json());
            } catch (error) {
                console.error('Error fetching PC data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Mock data for visualization until real data exists
    const funnelData = [
        { name: 'Lead', count: leads.length || 10, color: '#94a3b8' },
        { name: 'Contacted', count: 7, color: '#60a5fa' },
        { name: 'Quoted', count: 5, color: '#a78bfa' },
        { name: 'Negotiation', count: 3, color: '#fbbf24' },
        { name: 'Confirmed', count: 2, color: '#22c55e' },
    ];

    const paymentData = [
        { name: 'Paid', value: 400, fill: '#22c55e' },
        { name: 'Pending', value: 300, fill: '#fbbf24' },
        { name: 'Overdue', value: 100, fill: '#ef4444' },
    ];

    if (isLoading) {
        return <div className="p-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Private Charter Dashboard
                </h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    Management overview for premium yacht charters.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Total Leads', value: leads.length, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { title: 'New Leads (Today)', value: 0, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Confirmed Bookings', value: 0, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Pending Payments', value: '$0', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((kpi, i) => (
                    <Card key={i} className="overflow-hidden border-none shadow-premium hover:shadow-premium-hover transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                                    <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
                                </div>
                                <div className={`${kpi.bg} p-3 rounded-xl`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: 'Monthly Revenue', value: '$0', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { title: 'Upcoming Trips', value: 0, icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { title: 'Yacht Utilization', value: '0%', icon: Ship, color: 'text-cyan-600', bg: 'bg-cyan-50' },
                    { title: 'Cancelled/No-show', value: 0, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((kpi, i) => (
                    <Card key={i} className="overflow-hidden border-none shadow-premium hover:shadow-premium-hover transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                                    <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
                                </div>
                                <div className={`${kpi.bg} p-3 rounded-xl`}>
                                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Areas */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="rounded-lg">Executives Overview</TabsTrigger>
                    <TabsTrigger value="sales" className="rounded-lg">Sales Analysis</TabsTrigger>
                    <TabsTrigger value="operations" className="rounded-lg">Operations</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-12">
                        <Card className="md:col-span-8 shadow-premium border-none">
                            <CardHeader>
                                <CardTitle>Private Charter Sales Funnel</CardTitle>
                                <CardDescription>Conversion progress from lead to confirmed booking</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnelData} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tick={{ fill: '#64748B', fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                        />
                                        <Tooltip cursor={{ fill: '#F1F5F9' }} />
                                        <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                                            {funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-4 shadow-premium border-none">
                            <CardHeader>
                                <CardTitle>Payment Status</CardTitle>
                                <CardDescription>Invoicing distribution</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 mt-4">
                                    {paymentData.map(d => (
                                        <div key={d.name} className="flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.fill }} />
                                            <span className="text-xs text-muted-foreground">{d.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sales">
                    {/* Detailed sales charts, agent performance */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="shadow-premium border-none">
                            <CardHeader><CardTitle>Agent Performance</CardTitle></CardHeader>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Coming Soon: Agent-wise conversion metrics.
                            </CardContent>
                        </Card>
                        <Card className="shadow-premium border-none">
                            <CardHeader><CardTitle>Source Analysis</CardTitle></CardHeader>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                Coming Soon: Leads by platform (WhatsApp, Instagram, Web).
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="operations">
                    <Card className="shadow-premium border-none">
                        <CardHeader>
                            <CardTitle>Check-ins Today</CardTitle>
                            <CardDescription>Real-time boarding status for private charters</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No trips scheduled for today.
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
