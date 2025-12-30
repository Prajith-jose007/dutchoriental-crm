
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, CheckCircle, XCircle, User as UserIcon, Users as UsersIcon, Baby } from 'lucide-react';
import type { Lead, LeadPackageQuantity } from '@/lib/types';
import { format, parseISO, isValid } from 'date-fns';

export default function CheckInPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<Lead | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) {
            toast({ title: "Input Required", description: "Please enter a ticket number or reference.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setSearchResult(null);

        try {
            const response = await fetch(`/api/check-in?query=${encodeURIComponent(searchQuery.trim())}`);
            if (!response.ok) {
                if (response.status === 404) {
                    toast({ title: "Not Found", description: "No booking found with that ticket number.", variant: "destructive" });
                } else {
                    throw new Error('Search failed');
                }
                return;
            }
            const data = await response.json();
            setSearchResult(data);
        } catch (error) {
            console.error("Search error:", error);
            toast({ title: "Error", description: "An error occurred while searching.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async (undo: boolean = false) => {
        if (!searchResult) return;

        setIsCheckingIn(true);
        const action = undo ? 'undo-check-in' : 'check-in';

        try {
            const response = await fetch('/api/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: searchResult.id, action }),
            });

            if (!response.ok) {
                throw new Error('Action failed');
            }

            const data = await response.json();

            // Update local state
            setSearchResult(prev => prev ? ({
                ...prev,
                checkInStatus: undo ? 'Not Checked In' : 'Checked In',
                checkInTime: undo ? undefined : data.checkInTime
            }) : null);

            toast({
                title: undo ? "Check-in Undone" : "Checked In Successfully",
                description: undo ? "Guest is marked as not checked in." : `Guest ${searchResult.clientName} has been checked in.`,
                variant: undo ? "default" : "default",
                className: undo ? "" : "bg-green-600 text-white"
            });

        } catch (error) {
            console.error("Check-in error:", error);
            toast({ title: "Error", description: "Failed to update check-in status.", variant: "destructive" });
        } finally {
            setIsCheckingIn(false);
        }
    };

    const calculateDetails = (lead: Lead) => {
        const quantities = lead.packageQuantities || [];

        // Detail 1: Total Bookings (Total Guests)
        const totalGuests = quantities.reduce((sum, p) => sum + p.quantity, 0) + (lead.freeGuestCount || 0);

        // Detail 2: How many children
        // Assuming package names contain 'child' (case insensitive)
        const totalChildren = quantities
            .filter(p => p.packageName.toLowerCase().includes('child'))
            .reduce((sum, p) => sum + p.quantity, 0);

        // Detail 3: Type of Booking (Breakdown)
        const breakdown = [
            // Paid Packages
            ...quantities.filter(q => q.quantity > 0).map(q => `${q.quantity}x ${q.packageName}`),
            // Free Guests Breakdown
            ...(lead.freeGuestDetails?.map(fg => `${fg.quantity}x Free ${fg.type}`) || [])
        ];

        // Fallback for simple count if detailed breakdown missing but count exists
        if ((!lead.freeGuestDetails || lead.freeGuestDetails.length === 0) && lead.freeGuestCount && lead.freeGuestCount > 0) {
            breakdown.push(`${lead.freeGuestCount}x Free Guest(s)`);
        }

        // Detail 4: Additional Packages
        const hasAdditionalCharges = (lead.perTicketRate && lead.perTicketRate > 0);
        let additionalChargesAmount = 0;
        if (hasAdditionalCharges) {
            additionalChargesAmount = lead.perTicketRate!;
            breakdown.push(`Other Charges: AED ${additionalChargesAmount}`);
        }

        return { totalGuests, totalChildren, breakdown, hasAdditionalCharges, additionalChargesAmount };
    };

    const details = searchResult ? calculateDetails(searchResult) : null;

    return (
        <div className="space-y-6">
            <PageHeader title="Guest Check-In" description="Verify tickets and check in guests." />

            <Card className="max-w-xl mx-auto">
                <CardHeader>
                    <CardTitle>Search Booking</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            placeholder="Enter Ticket Number, Ref No, or Booking ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                            autoFocus
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {searchResult && details && (
                <Card className={`max-w-xl mx-auto border-l-4 ${searchResult.checkInStatus === 'Checked In' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold">{searchResult.clientName}</h3>
                                <p className="text-sm text-muted-foreground">Ticket: <span className="font-mono text-foreground">{searchResult.transactionId || 'N/A'}</span></p>
                            </div>
                            <Badge variant={searchResult.checkInStatus === 'Checked In' ? "default" : "outline"} className={searchResult.checkInStatus === 'Checked In' ? "bg-green-600 hover:bg-green-700" : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"}>
                                {searchResult.checkInStatus === 'Checked In' ? (
                                    <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Checked In</span>
                                ) : (
                                    <span className="flex items-center gap-1">Not Checked In</span>
                                )}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 py-4">

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center justify-center text-center border">
                                <UsersIcon className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-2xl font-bold">{details.totalGuests}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Guests</span>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-lg flex flex-col items-center justify-center text-center border">
                                <Baby className="h-6 w-6 text-muted-foreground mb-1" />
                                <span className="text-2xl font-bold">{details.totalChildren}</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Children</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">Booking Breakdown</h4>
                                <div className="space-y-2">
                                    {details.breakdown.length > 0 ? (
                                        details.breakdown.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-muted/20 px-3 py-2 rounded text-sm">
                                                <span>{item}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No specific packages.</p>
                                    )}
                                </div>
                            </div>

                            {details.hasAdditionalCharges && (
                                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Has Additional Charges / Packages
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground pt-4 border-t">
                            Event Date: {isValid(parseISO(searchResult.month)) ? format(parseISO(searchResult.month), 'PPP') : 'N/A'}<br />
                            Yacht: {searchResult.yacht}
                        </div>

                    </CardContent>
                    <CardFooter className="flex gap-2 justify-end pt-2">
                        {searchResult.checkInStatus !== 'Checked In' ? (
                            <Button onClick={() => handleCheckIn(false)} disabled={isCheckingIn} className="w-full bg-green-600 hover:bg-green-700 text-white">
                                {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                Check In Guest
                            </Button>
                        ) : (
                            <Button onClick={() => handleCheckIn(true)} disabled={isCheckingIn} variant="outline" className="w-full text-muted-foreground hover:text-foreground">
                                {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                Undo Check-In
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
