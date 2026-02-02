'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Loader2,
    CheckCircle,
    Plus,
    Lock,
    Save
} from 'lucide-react';
import type { Lead, LeadPackageQuantity, Yacht, CheckedInQuantity } from '@/lib/types';
import { format, parseISO, isValid, isSameDay, startOfDay } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface CheckInCardProps {
    lead: Lead;
    yachts: Yacht[];
}

export function CheckInCard({ lead: initialLead, yachts }: CheckInCardProps) {
    const { toast } = useToast();
    const [data, setData] = useState<Lead>(initialLead);
    const [originalData, setOriginalData] = useState<Lead>(JSON.parse(JSON.stringify(initialLead)));
    const [isSaving, setIsSaving] = useState(false);
    const [manualComment, setManualComment] = useState('');

    useEffect(() => {
        // Ensure checkedInQuantities is initialized if missing
        if (!data.checkedInQuantities) {
            const initQuantities = (data.packageQuantities || []).map((p: LeadPackageQuantity) => ({
                packageId: p.packageId,
                quantity: data.checkInStatus === 'Checked In' ? p.quantity : 0
            }));
            setData(prev => ({ ...prev, checkedInQuantities: initQuantities }));
        }
    }, []);

    const handleSyncCheckIn = async (finalLock: boolean = false) => {
        setIsSaving(true);
        let autoNotes = "";
        const changes: string[] = [];

        if (data.yacht !== originalData.yacht) {
            const oldBoat = yachts.find(y => y.id === originalData.yacht)?.name || originalData.yacht;
            const newBoat = yachts.find(y => y.id === data.yacht)?.name || data.yacht;
            changes.push(`Boat changed: ${oldBoat} -> ${newBoat}`);
        }

        if (data.clientName !== originalData.clientName) {
            changes.push(`Client name updated: ${originalData.clientName} -> ${data.clientName}`);
        }

        const oldPkgs = originalData.packageQuantities || [];
        const newPkgs = data.packageQuantities || [];

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

        let newCheckInStatus: Lead['checkInStatus'] = 'Not Checked In';
        const totalBooked = (data.packageQuantities || []).reduce((sum, p) => sum + p.quantity, 0);
        const totalCheckedIn = (data.checkedInQuantities || []).reduce((sum, p) => sum + p.quantity, 0);

        if (finalLock) {
            newCheckInStatus = 'Checked In';
        } else if (totalCheckedIn === 0) {
            newCheckInStatus = 'Not Checked In';
        } else if (totalCheckedIn >= totalBooked) {
            newCheckInStatus = 'Checked In';
        } else {
            newCheckInStatus = 'Partially Checked In';
        }

        let nextStatus = data.status;
        if (finalLock) {
            nextStatus = 'Checked In';
        } else if (totalCheckedIn > 0 && (data.status === 'Confirmed' || data.status === 'Closed (Won)')) {
            nextStatus = 'In Progress';
        }

        const finalCheckedInQuantities = finalLock
            ? (data.packageQuantities || []).map(p => ({ packageId: p.packageId, quantity: p.quantity }))
            : data.checkedInQuantities;

        const dataToSync = {
            ...data,
            checkedInQuantities: finalCheckedInQuantities,
            checkInStatus: newCheckInStatus,
            status: nextStatus,
            notes: (data.notes || '') + autoNotes
        };

        try {
            const response = await fetch('/api/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: data.id,
                    action: 'sync-check-in',
                    leadData: dataToSync
                }),
            });

            if (!response.ok) throw new Error('Sync failed');

            setData(dataToSync);
            setOriginalData(JSON.parse(JSON.stringify(dataToSync)));
            setManualComment('');

            toast({
                title: finalLock ? "Guest Checked In" : "Progress Saved",
                description: finalLock ? "Booking updated and locked." : "Progress saved.",
                className: "bg-green-600 text-white"
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const updateCheckedInQty = (packageId: string, delta: number) => {
        const currentCheckIn = data.checkedInQuantities || [];
        const existing = currentCheckIn.find(c => c.packageId === packageId);
        const booked = data.packageQuantities?.find(p => p.packageId === packageId)?.quantity || 0;

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
        setData({ ...data, checkedInQuantities: newList });
    };

    const updateBookedQty = (packageId: string, delta: number) => {
        const packages = [...(data.packageQuantities || [])];
        const idx = packages.findIndex(p => p.packageId === packageId);
        if (idx === -1) return;

        packages[idx] = { ...packages[idx], quantity: Math.max(0, packages[idx].quantity + delta) };

        const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + (data.perTicketRate || 0);
        const commissionAmount = Number(data.commissionAmount || 0);
        const netAmount = Number((totalAmount - commissionAmount).toFixed(2));
        const balanceAmount = Number((netAmount - (data.paidAmount || 0)).toFixed(2));

        setData({
            ...data,
            packageQuantities: packages,
            totalAmount,
            commissionAmount,
            netAmount,
            balanceAmount
        });
    };

    const addPackage = (packageId: string) => {
        if (!yachts.length) return;
        const yacht = yachts.find(y => y.id === data.yacht);
        const pkg = yacht?.packages?.find(p => p.id === packageId);
        if (!pkg) return;

        const packages = [...(data.packageQuantities || [])];
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

        const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + (data.perTicketRate || 0);
        const commissionAmount = Number(data.commissionAmount || 0);
        const netAmount = Number((totalAmount - commissionAmount).toFixed(2));
        const balanceAmount = Number((netAmount - (data.paidAmount || 0)).toFixed(2));

        setData({
            ...data,
            packageQuantities: packages,
            totalAmount,
            commissionAmount,
            netAmount,
            balanceAmount
        });
    };

    const isLocked = data.status === 'Checked In' || data.status === 'Completed';
    const netAdjustment = data.netAmount - (originalData?.netAmount || data.netAmount);
    const balanceDue = data.balanceAmount;

    return (
        <Card className={`border-l-4 shadow-md ${isLocked ? 'border-l-blue-500' : data.checkInStatus === 'Checked In' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/10">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <Input
                            value={data.clientName}
                            onChange={(e) => setData({ ...data, clientName: e.target.value })}
                            className="h-7 w-48 font-bold text-lg bg-transparent border-none focus-visible:ring-1 p-0 px-1"
                            disabled={isLocked}
                        />
                        {isLocked && <Badge variant="secondary" className="h-5 text-[10px]"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">ID: {data.transactionId || data.id}</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                    <div className="mr-3">
                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Payment Status</p>
                        <Badge variant={balanceDue > 0 ? "destructive" : "default"} className={`font-bold ${balanceDue > 0 ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"}`}>
                            {balanceDue > 0 ? `Unpaid / Balance` : "Fully Paid"}
                        </Badge>
                    </div>
                    <div className="hidden md:block border-l pl-3 mr-2">
                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Event Date</p>
                        <p className={`text-xs font-semibold ${(() => {
                                if (!isValid(parseISO(data.month))) return "";
                                const date = parseISO(data.month);
                                const today = new Date();
                                if (isSameDay(date, today)) return "text-green-600 font-bold";
                                if (startOfDay(date) < startOfDay(today)) return "text-orange-500 font-bold"; // Saffron/Orange for past
                                return "text-red-600 font-bold"; // Red for future
                            })()
                            }`}>
                            {isValid(parseISO(data.month)) ? format(parseISO(data.month), 'dd MMM yyyy') : 'N/A'}
                        </p>
                    </div>
                    <div className="border-l pl-3">
                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Arrival Status</p>
                        <Badge variant={data.checkInStatus === 'Checked In' ? "default" : "outline"} className={
                            data.checkInStatus === 'Checked In' ? "bg-green-600 text-white h-6" :
                                data.checkInStatus === 'Partially Checked In' ? "bg-orange-100 text-orange-800 border-orange-200 h-6" :
                                    "bg-yellow-100 text-yellow-800 border-yellow-200 h-6"
                        }>
                            {data.checkInStatus}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {/* Summary Info Block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border mb-2">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Boat Name</p>
                        <p className="font-semibold text-sm truncate" title={yachts.find(y => y.id === data.yacht)?.name || data.yacht}>
                            {yachts.find(y => y.id === data.yacht)?.name || data.yacht || 'Not Selected'}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Guest Name</p>
                        <p className="font-semibold text-sm truncate" title={data.clientName}>{data.clientName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">No. of Tickets</p>
                        <div className="flex items-baseline gap-1">
                            <p className="font-semibold text-sm">{(data.packageQuantities || []).reduce((sum, p) => sum + p.quantity, 0)}</p>
                            <span className="text-[10px] text-muted-foreground">Pax</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Ticket Number</p>
                        <p className="font-mono text-sm font-medium">{data.transactionId || 'N/A'}</p>
                        {data.bookingRefNo && data.bookingRefNo !== data.transactionId && (
                            <p className="text-[10px] text-muted-foreground">Ref: {data.bookingRefNo}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/20 rounded-md border space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">Boat / Yacht</p>
                        <Select
                            disabled={isLocked}
                            value={data.yacht}
                            onValueChange={(val) => setData({ ...data, yacht: val })}
                        >
                            <SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger>
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
                            <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Add new package..." /></SelectTrigger>
                            <SelectContent>
                                {yachts.find(y => y.id === data.yacht)?.packages?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name} (AED {p.rate})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase px-2">
                        <span>Package Name</span>
                        <div className="flex gap-12 mr-16">
                            <span className="w-20 text-center">Booked</span>
                            <span className="w-20 text-center text-green-700">Arrived</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        {data.packageQuantities?.filter(p => p.quantity > 0 || (data.checkedInQuantities?.find(c => c.packageId === p.packageId)?.quantity || 0) > 0).map((pkg) => {
                            const checkedIn = (data.checkedInQuantities || []).find((c: any) => c.packageId === pkg.packageId)?.quantity || 0;
                            return (
                                <div key={pkg.packageId} className="px-3 py-2 bg-white dark:bg-slate-900 rounded-md border shadow-sm flex items-center justify-between group">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{pkg.packageName}</p>
                                        <p className="text-[10px] text-muted-foreground whitespace-nowrap">AED {pkg.rate}/ea</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-muted/30 rounded border p-0.5">
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateBookedQty(pkg.packageId, -1)} disabled={isLocked || pkg.quantity <= 0}>-</Button>
                                            <span className="w-7 text-center text-xs font-bold">{pkg.quantity}</span>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateBookedQty(pkg.packageId, 1)} disabled={isLocked}><Plus className="h-3 w-3" /></Button>
                                        </div>
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

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-3">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground">Financial Summary</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <p className="text-[10px] text-muted-foreground">Original Total</p>
                            <p className="font-mono font-medium">AED {(originalData.totalAmount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">New Total</p>
                            <p className="font-mono font-medium">AED {(data.totalAmount || 0).toLocaleString()}</p>
                        </div>
                        <div className={`${netAdjustment !== 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 p-1 rounded -m-1' : ''}`}>
                            <p className="text-[10px] text-muted-foreground">Adjustments</p>
                            <p className={`font-mono font-bold ${netAdjustment > 0 ? 'text-red-600' : netAdjustment < 0 ? 'text-green-600' : ''}`}>
                                {netAdjustment > 0 ? '+' : ''}AED {netAdjustment.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Balance Due</p>
                            <p className={`font-mono text-lg font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                AED {balanceDue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

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

                <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-4 border-t">
                    <div className="flex gap-2 w-full md:w-auto">
                        {!isLocked ? (
                            <>
                                <Button variant="outline" onClick={() => handleSyncCheckIn(false)} disabled={isSaving} className="flex-1 md:flex-none h-11 border-slate-300">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Progress
                                </Button>
                                <Button onClick={() => handleSyncCheckIn(true)} disabled={isSaving} className="flex-1 md:flex-none h-11 bg-green-600 hover:bg-green-700 font-bold px-6">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                    CHECK IN & LOCK
                                </Button>
                            </>
                        ) : (
                            <div className="w-full flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-md text-xs italic text-muted-foreground border">
                                <Lock className="h-3 w-3" /> Booking is finalized as {data.status}.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
