'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PrivateCharterCustomersPage() {
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customer Management</h1>
                    <p className="text-slate-500 mt-1">Manage private charter customer profiles and history.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Customers Database</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2">Customer Management</p>
                        <p className="text-sm">This feature will display customer profiles, contact information, and booking history.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
