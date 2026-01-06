'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PrivateCharterReportsPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
                    <p className="text-slate-500 mt-1">View performance metrics and insights for private charters.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reports Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2">Reports & Analytics</p>
                        <p className="text-sm">This feature will display revenue reports, KPIs, and performance analytics for private charter operations.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
