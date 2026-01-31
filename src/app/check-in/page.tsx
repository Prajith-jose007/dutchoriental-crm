
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
const QrScanner = dynamic(() => import('@/components/QrScanner').then(mod => mod.QrScanner), { ssr: false });
import {
    Loader2,
    Search,
    CheckCircle,
    XCircle,
    Users as UsersIcon,
    Baby,
    Plus,
    ArrowUpCircle,
    Lock,
    Save,
    QrCode
} from 'lucide-react';
import type { Lead, LeadPackageQuantity, Yacht, CheckedInQuantity } from '@/lib/types';
import { format, parseISO, isValid } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { CheckInCard } from './_components/CheckInCard'; // Added import for CheckInCard

export default function CheckInPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<Lead[]>([]);
    const [yachts, setYachts] = useState<Yacht[]>([]);
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        fetchYachts();
    }, []);

    const fetchYachts = async () => {
        try {
            const resp = await fetch('/api/yachts');
            if (resp.ok) {
                const data = await resp.json();
                setYachts(data);
            }
        } catch (e) {
            console.error("Failed to fetch yachts", e);
        }
    };

    const handleSearch = async (e?: React.FormEvent | null, overrideQuery?: string) => {
        if (e) e.preventDefault();
        const query = overrideQuery || searchQuery;

        if (!query.trim()) {
            toast({ title: "Input Required", description: "Please enter a ticket number or reference.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setSearchResults([]);

        try {
            const response = await fetch(`/api/check-in?query=${encodeURIComponent(query.trim())}`);
            if (!response.ok) {
                if (response.status === 404) {
                    toast({ title: "Not Found", description: "No booking found.", variant: "destructive" });
                } else {
                    throw new Error('Search failed');
                }
                return;
            }
            const data = await response.json();

            // Handle both single object and array responses (though API should now return array)
            const results = Array.isArray(data) ? data : [data];
            setSearchResults(results);

            if (results.length > 1) {
                toast({ title: "Multiple Bookings Found", description: `Found ${results.length} bookings for this reference.` });
            }

        } catch (error) {
            console.error("Search error:", error);
            toast({ title: "Error", description: "An error occurred while searching.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleScan = (code: string) => {
        setShowScanner(false);
        setSearchQuery(code);
        handleSearch(null, code);
        toast({ title: "Scanned", description: `Found code: ${code}` });
    };

    return (
        <div className="space-y-4">
            <PageHeader title="Guest Check-In" description="Verify tickets, upgrade boats/packages, and check in guests." />

            <Card className="max-w-xl mx-auto shadow-sm">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Enter Ticket Number, Ref No, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                        <Button type="button" variant="outline" size="icon" onClick={() => setShowScanner(true)} title="Scan QR Code" className="shrink-0">
                            <QrCode className="h-4 w-4" />
                        </Button>
                        <Button type="submit" disabled={isLoading} size="sm">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {searchResults.length > 0 && (
                <div className="max-w-4xl mx-auto space-y-8">
                    {searchResults.map((lead) => (
                        <CheckInCard key={lead.id} lead={lead} yachts={yachts} />
                    ))}
                </div>
            )}

            {showScanner && (
                <QrScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}
