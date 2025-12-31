
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
    Save
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

export default function CheckInPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<Lead | null>(null);
    const [originalData, setOriginalData] = useState<Lead | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [yachts, setYachts] = useState<Yacht[]>([]);
    const [manualComment, setManualComment] = useState('');

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

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) {
            toast({ title: "Input Required", description: "Please enter a ticket number or reference.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setSearchResult(null);
        setOriginalData(null);
        setManualComment('');

        try {
            const response = await fetch(`/api/check-in?query=${encodeURIComponent(searchQuery.trim())}`);
            if (!response.ok) {
                if (response.status === 404) {
                    toast({ title: "Not Found", description: "No booking found.", variant: "destructive" });
                } else {
                    throw new Error('Search failed');
                }
                return;
            }
            const data = await response.json();

            // Ensure checkedInQuantities is initialized
            if (!data.checkedInQuantities) {
                data.checkedInQuantities = (data.packageQuantities || []).map((p: LeadPackageQuantity) => ({
                    packageId: p.packageId,
                    quantity: data.checkInStatus === 'Checked In' ? p.quantity : 0
                }));
            }

            setSearchResult(data);
            setOriginalData(JSON.parse(JSON.stringify(data))); // Deep copy for change tracking
        } catch (error) {
            console.error("Search error:", error);
            toast({ title: "Error", description: "An error occurred while searching.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSyncCheckIn = async (finalLock: boolean = false) => {
        if (!searchResult || !originalData) return;

        setIsSaving(true);

        // Generate automated comment for changes
        let autoNotes = "";
        const changes: string[] = [];

        if (searchResult.yacht !== originalData.yacht) {
            const oldBoat = yachts.find(y => y.id === originalData.yacht)?.name || originalData.yacht;
            const newBoat = yachts.find(y => y.id === searchResult.yacht)?.name || searchResult.yacht;
            changes.push(`Boat changed: ${oldBoat} -> ${newBoat}`);
        }

        if (searchResult.clientName !== originalData.clientName) {
            changes.push(`Client name updated: ${originalData.clientName} -> ${searchResult.clientName}`);
        }

        // Compare packages
        const oldPkgs = originalData.packageQuantities || [];
        const newPkgs = searchResult.packageQuantities || [];

        newPkgs.forEach(np => {
            const op = oldPkgs.find(o => o.packageId === np.packageId);
            if (!op) {
                changes.push(`Added Package: ${np.packageName} (Qty: ${np.quantity})`);
            } else if (op.quantity !== np.quantity) {
                changes.push(`Adjusted ${np.packageName}: ${op.quantity} -> ${np.quantity}`);
            }
        });

        if (changes.length > 0 || manualComment.trim()) {
            const timestamp = format(new Date(), 'dd/MM HH:mm');
            autoNotes = `\n[Check-in ${timestamp}]: ${changes.join(', ')}${manualComment.trim() ? '. Remark: ' + manualComment.trim() : ''}`;
        }

        // Calculate new status
        let newCheckInStatus: Lead['checkInStatus'] = 'Not Checked In';
        const totalBooked = (searchResult.packageQuantities || []).reduce((sum, p) => sum + p.quantity, 0);
        const totalCheckedIn = (searchResult.checkedInQuantities || []).reduce((sum, p) => sum + p.quantity, 0);

        if (totalCheckedIn === 0) {
            newCheckInStatus = 'Not Checked In';
        } else if (totalCheckedIn >= totalBooked) {
            newCheckInStatus = 'Checked In';
        } else {
            newCheckInStatus = 'Partially Checked In';
        }

        const dataToSync = {
            ...searchResult,
            checkInStatus: newCheckInStatus,
            status: finalLock ? 'Completed' : searchResult.status,
            notes: (searchResult.notes || '') + autoNotes
        };

        try {
            const response = await fetch('/api/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: searchResult.id,
                    action: 'sync-check-in',
                    leadData: dataToSync
                }),
            });

            if (!response.ok) throw new Error('Sync failed');

            setSearchResult(dataToSync);
            setOriginalData(JSON.parse(JSON.stringify(dataToSync)));
            setManualComment('');

            toast({
                title: finalLock ? "Booking Completed" : "Check-in Updated",
                description: finalLock ? "Booking has been finalized as Completed and locked." : "Check-in progress saved successfully.",
                className: "bg-green-600 text-white"
            });

        } catch (error) {
            console.error("Sync error:", error);
            toast({ title: "Error", description: "Failed to update check-in.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const updateCheckedInQty = (packageId: string, delta: number) => {
        if (!searchResult) return;
        const currentCheckIn = searchResult.checkedInQuantities || [];
        const existing = currentCheckIn.find(c => c.packageId === packageId);
        const booked = searchResult.packageQuantities?.find(p => p.packageId === packageId)?.quantity || 0;

        let newList: CheckedInQuantity[] = [];
        if (existing) {
            newList = currentCheckIn.map(c =>
                c.packageId === packageId
                    ? { ...c, quantity: Math.max(0, Math.min(booked, c.quantity + delta)) }
                    : c
            );
        } else {
            newList = [...currentCheckIn, { packageId, quantity: Math.max(0, delta) }];
        }
        setSearchResult({ ...searchResult, checkedInQuantities: newList });
    };

    const updateBookedQty = (packageId: string, delta: number) => {
        if (!searchResult) return;
        const packages = [...(searchResult.packageQuantities || [])];
        const idx = packages.findIndex(p => p.packageId === packageId);
        if (idx === -1) return;

        packages[idx] = { ...packages[idx], quantity: Math.max(0, packages[idx].quantity + delta) };

        // Recalculate totals
        const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + (searchResult.perTicketRate || 0);
        const commissionPercentage = Number(searchResult.commissionPercentage || 0);
        const commissionAmount = Number(((totalAmount * commissionPercentage) / 100).toFixed(2));
        const netAmount = Number((totalAmount - commissionAmount).toFixed(2));
        const balanceAmount = Number((netAmount - (searchResult.paidAmount || 0)).toFixed(2));

        setSearchResult({
            ...searchResult,
            packageQuantities: packages,
            totalAmount,
            commissionAmount,
            netAmount,
            balanceAmount
        });
    };

    const addPackage = (packageId: string) => {
        if (!searchResult || !yachts.length) return;
        const yacht = yachts.find(y => y.id === searchResult.yacht);
        const pkg = yacht?.packages?.find(p => p.id === packageId);
        if (!pkg) return;

        const packages = [...(searchResult.packageQuantities || [])];
        if (packages.some(p => p.packageId === packageId)) {
            updateBookedQty(packageId, 1);
            return;
        }

        packages.push({
            packageId: pkg.id,
            packageName: pkg.name,
            quantity: 1,
            rate: pkg.rate || 0
        });

        const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + (searchResult.perTicketRate || 0);
        const commissionPercentage = Number(searchResult.commissionPercentage || 0);
        const commissionAmount = Number(((totalAmount * commissionPercentage) / 100).toFixed(2));
        const netAmount = Number((totalAmount - commissionAmount).toFixed(2));

        setSearchResult({
            ...searchResult,
            packageQuantities: packages,
            totalAmount,
            commissionAmount,
            netAmount,
            balanceAmount: Number((netAmount - (searchResult.paidAmount || 0)).toFixed(2))
        });
    };

    const isLocked = searchResult?.status === 'Completed' || searchResult?.status === 'Closed (Won)';

    const netAdjustment = searchResult ? (searchResult.netAmount - (originalData?.netAmount || searchResult.netAmount)) : 0;
    const balanceDue = searchResult?.balanceAmount || 0;

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
                        <Button type="submit" disabled={isLoading} size="sm">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {searchResult && (
                <div className="max-w-4xl mx-auto space-y-4">
                    <Card className={`border-l-4 shadow-md ${isLocked ? 'border-l-blue-500' : searchResult.checkInStatus === 'Checked In' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/10">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={searchResult.clientName}
                                        onChange={(e) => setSearchResult({ ...searchResult, clientName: e.target.value })}
                                        className="h-7 w-48 font-bold text-lg bg-transparent border-none focus-visible:ring-1 p-0 px-1"
                                        disabled={isLocked}
                                    />
                                    {isLocked && <Badge variant="secondary" className="h-5 text-[10px]"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
                                </div>
                                <p className="text-[11px] text-muted-foreground font-mono">ID: {searchResult.transactionId || searchResult.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right mr-2 hidden md:block">
                                    <p className="text-[10px] text-muted-foreground uppercase">Event Date</p>
                                    <p className="text-xs font-semibold">{isValid(parseISO(searchResult.month)) ? format(parseISO(searchResult.month), 'dd MMM yyyy') : 'N/A'}</p>
                                </div>
                                <Badge variant={searchResult.checkInStatus === 'Checked In' ? "default" : "outline"} className={
                                    searchResult.checkInStatus === 'Checked In' ? "bg-green-600 text-white h-7" :
                                        searchResult.checkInStatus === 'Partially Checked In' ? "bg-orange-100 text-orange-800 border-orange-200 h-7" :
                                            "bg-yellow-100 text-yellow-800 border-yellow-200 h-7"
                                }>
                                    {searchResult.checkInStatus}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">

                            {/* Top Controls: Boat & Add Packages */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-muted/20 rounded-md border space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                        Boat / Yacht
                                    </p>
                                    <Select
                                        disabled={isLocked}
                                        value={searchResult.yacht}
                                        onValueChange={(val) => setSearchResult({ ...searchResult, yacht: val })}
                                    >
                                        <SelectTrigger className="h-9 bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yachts.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-100 space-y-2">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> Upgrade / Add Package
                                    </p>
                                    <Select disabled={isLocked} onValueChange={(val) => addPackage(val)}>
                                        <SelectTrigger className="h-9 bg-white">
                                            <SelectValue placeholder="Add new package..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {yachts.find(y => y.id === searchResult.yacht)?.packages?.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name} (AED {p.rate})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Package List - More Compact */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase px-2">
                                    <span>Package Name</span>
                                    <div className="flex gap-12 mr-16">
                                        <span className="w-20 text-center">Booked</span>
                                        <span className="w-20 text-center text-green-700">Arrived</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    {searchResult.packageQuantities?.filter(p => p.quantity > 0 || (searchResult.checkedInQuantities?.find(c => c.packageId === p.packageId)?.quantity || 0) > 0).map((pkg) => {
                                        const checkedIn = (searchResult.checkedInQuantities || []).find((c: any) => c.packageId === pkg.packageId)?.quantity || 0;
                                        return (
                                            <div key={pkg.packageId} className="px-3 py-2 bg-white dark:bg-slate-900 rounded-md border shadow-sm flex items-center justify-between group">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate">{pkg.packageName}</p>
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">AED {pkg.rate}/ea</p>
                                                        <Badge variant="outline" className="h-4 text-[9px] px-1 py-0 border-slate-200 text-slate-500 font-mono">
                                                            Line: AED {(pkg.quantity * pkg.rate).toFixed(2)}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {/* Total Booked */}
                                                    <div className="flex items-center bg-muted/30 rounded border p-0.5">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateBookedQty(pkg.packageId, -1)} disabled={isLocked || pkg.quantity <= 0}>-</Button>
                                                        <span className="w-7 text-center text-xs font-bold">{pkg.quantity}</span>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateBookedQty(pkg.packageId, 1)} disabled={isLocked}><Plus className="h-3 w-3" /></Button>
                                                    </div>

                                                    {/* Checked In */}
                                                    <div className="flex items-center bg-green-50 dark:bg-green-950/30 rounded border border-green-200 p-0.5">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-700" onClick={() => updateCheckedInQty(pkg.packageId, -1)} disabled={isLocked || checkedIn <= 0}>-</Button>
                                                        <span className="w-7 text-center text-xs font-bold text-green-700">{checkedIn}</span>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-700" onClick={() => updateCheckedInQty(pkg.packageId, 1)} disabled={isLocked || checkedIn >= pkg.quantity}><Plus className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Comment Section */}
                            {!isLocked && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-2">Check-in Remarks / Reason for Change</p>
                                    <textarea
                                        className="w-full text-sm p-3 min-h-[80px] rounded-md border bg-white focus:ring-1 focus:ring-slate-400 outline-none resize-none placeholder:italic"
                                        placeholder="Add a remark about upgrades or changes..."
                                        value={manualComment}
                                        onChange={(e) => setManualComment(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Summary Footer */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t">
                                <div className="flex gap-8 w-full md:w-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase">New Total (Net)</span>
                                        <span className="text-base font-bold text-slate-800">AED {searchResult.netAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-muted-foreground uppercase">Today's Adjustment</span>
                                        <span className={`text-base font-bold ${netAdjustment > 0 ? 'text-blue-600' : netAdjustment < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                            {netAdjustment > 0 ? '+' : ''}AED {netAdjustment?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col border-l pl-8 border-slate-200">
                                        <span className="text-[10px] text-muted-foreground uppercase">Final Balance</span>
                                        <span className={`text-base font-bold ${balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                            AED {balanceDue?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    {!isLocked ? (
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleSyncCheckIn(false)}
                                                disabled={isSaving}
                                                className="flex-1 md:flex-none h-11 border-slate-300"
                                            >
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                Save Partial
                                            </Button>
                                            <Button
                                                onClick={() => handleSyncCheckIn(true)}
                                                disabled={isSaving}
                                                className="flex-1 md:flex-none h-11 bg-green-600 hover:bg-green-700 font-bold px-6"
                                            >
                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                FINISH & LOCK
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="w-full flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-md text-xs italic text-muted-foreground border">
                                            <Lock className="h-3 w-3" /> Booking is finalized and locked. (Status: {searchResult.status})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
