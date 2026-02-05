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
    leads: Lead[];
    yachts: Yacht[];
}

export function CheckInCard({ leads: initialLeads, yachts }: CheckInCardProps) {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    // We maintain a "Primary Lead" for general fields (Name, Yacht, etc.) and calculate totals dynamically
    // But we need editing state. So we create a "Virtual Lead" state that represents the aggregated view.

    const [collectedNow, setCollectedNow] = useState(0);
    const [newAddonInput, setNewAddonInput] = useState<string>('');
    const [manualComment, setManualComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Calculate initial virtual state
    const calculateVirtualLead = (currentLeads: Lead[]): Lead => {
        // ... (existing logic)
        const primary = currentLeads[0];
        if (!primary) return {} as Lead;

        // Aggregate Packages
        const aggregatedPackages: LeadPackageQuantity[] = [];
        const aggregatedCheckedIn: CheckedInQuantity[] = [];

        currentLeads.forEach(l => {
            l.packageQuantities?.forEach(pq => {
                const existing = aggregatedPackages.find(ap => ap.packageId === pq.packageId);
                if (existing) {
                    existing.quantity += pq.quantity;
                } else {
                    aggregatedPackages.push({ ...pq });
                }
            });
            l.checkedInQuantities?.forEach(cq => {
                const existing = aggregatedCheckedIn.find(ac => ac.packageId === cq.packageId);
                if (existing) {
                    existing.quantity += cq.quantity;
                } else {
                    aggregatedCheckedIn.push({ ...cq });
                }
            });
        });

        // Calculate Totals using Components to ensure consistency
        const packageTotal = aggregatedPackages.reduce((sum, p) => sum + (p.quantity * p.rate), 0);
        const addonAmt = currentLeads.reduce((sum, l) => sum + (l.perTicketRate || 0), 0);
        const totalAmt = packageTotal + addonAmt;

        // Commision might be per lead, sum it up. Fallback to % if amount is missing.
        const totalComm = currentLeads.reduce((sum, l) => {
            // Recalc individual lead total to ensure commission is based on *current* booking state
            const leadPkgTotal = (l.packageQuantities || []).reduce((s, p) => s + (p.quantity * p.rate), 0);
            const leadTotal = leadPkgTotal + (l.perTicketRate || 0);

            const explicitComm = l.commissionAmount || 0;
            const calculatedComm = l.commissionPercentage ? (leadTotal * l.commissionPercentage / 100) : 0;

            // Prefer explicit, fallback to calculated if explicit is 0 but % exists
            let leadComm = explicitComm || calculatedComm;

            // Fix for "Phantom Balance": 
            // If comm is still 0, but booking is Confirmed and Paid < Total, assume difference is agent commission.
            const paid = l.paidAmount || 0;
            if (leadComm === 0 && (l.status === 'Confirmed' || l.paymentConfirmationStatus === 'CONFIRMED') && paid > 0 && paid < leadTotal) {
                const impliedDiff = leadTotal - paid;
                if (impliedDiff > 0) leadComm = impliedDiff;
            }

            return sum + leadComm;
        }, 0);
        const netAmt = totalAmt - totalComm; // Derived Net

        const paidAmt = currentLeads.reduce((sum, l) => sum + (l.paidAmount || 0), 0);
        // Balance is Net - Paid (or Total - Paid? Standard is Net - Paid for Agent, Total - Paid for Direct?)
        // Assuming Net Amount is the receivable.
        const balAmt = netAmt - paidAmt;
        const collectedAtCheckInTotal = currentLeads.reduce((sum, l) => sum + (l.collectedAtCheckIn || 0), 0);

        // Determine overall status
        const isAllCheckedIn = currentLeads.every(l => l.checkInStatus === 'Checked In');
        const isAllCompleted = currentLeads.every(l => l.status === 'Completed');
        const isSomeCheckedIn = currentLeads.some(l => l.checkedInQuantities && l.checkedInQuantities.some(q => q.quantity > 0));

        let compositeCheckInStatus: Lead['checkInStatus'] = 'Not Checked In';
        if (isAllCheckedIn) compositeCheckInStatus = 'Checked In';
        else if (isSomeCheckedIn) compositeCheckInStatus = 'Partially Checked In';

        return {
            ...primary,
            packageQuantities: aggregatedPackages,
            checkedInQuantities: aggregatedCheckedIn,
            totalAmount: totalAmt,
            netAmount: netAmt,
            paidAmount: paidAmt,
            balanceAmount: balAmt,
            collectedAtCheckIn: collectedAtCheckInTotal,
            commissionAmount: totalComm, // Store aggregated commission
            perTicketRate: addonAmt,
            checkInStatus: compositeCheckInStatus,
            status: isAllCompleted ? 'Completed' : (isAllCheckedIn ? 'Checked In' : primary.status),
            // Join IDs for display
            transactionId: currentLeads.map(l => l.transactionId).filter(Boolean).join(', '),
            bookingRefNo: currentLeads.map(l => l.bookingRefNo).filter(Boolean).join(', '),
        };
    };

    const [virtualData, setVirtualData] = useState<Lead>(() => calculateVirtualLead(initialLeads));
    const [originalVirtualData, setOriginalVirtualData] = useState<Lead>(() => calculateVirtualLead(initialLeads));

    useEffect(() => {
        // Re-calc if props change significantly (though we use local state primarily)
        setLeads(initialLeads);
        const v = calculateVirtualLead(initialLeads);
        setVirtualData(v);
        setOriginalVirtualData(JSON.parse(JSON.stringify(v)));
    }, [initialLeads]);

    const handleSyncCheckIn = async (finalLock: boolean = false) => {
        setIsSaving(true);
        const timestamp = format(new Date(), 'dd/MM HH:mm');
        let noteLog = `\n[Check-in ${timestamp}]: ${finalLock ? 'Final Check-in' : 'Progress Saved'}.`;
        if (manualComment) noteLog += ` Note: ${manualComment}`;
        if (collectedNow > 0) noteLog += ` Collected: AED ${collectedNow}`;
        if (newAddonInput && parseFloat(newAddonInput) > 0) noteLog += ` Add-on Added: AED ${newAddonInput}`;


        // Distribute changes back to individual leads
        const updatedLeads: Lead[] = JSON.parse(JSON.stringify(leads));

        // Pre-Fix: Ensure "Implied Commission" is applied to leads before processing
        // This matches the logic in calculateVirtualLead to persist the "No Balance" state for Agent bookings
        // (Fixes the issue where saving would revert to "Phantom Balance" due to missing commission in DB)
        updatedLeads.forEach(l => {
            let comm = l.commissionAmount || 0;
            const paid = l.paidAmount || 0;

            // Recalc total using current package state (before upgrades in this func)
            const pkgTotal = (l.packageQuantities || []).reduce((s, p) => s + (p.quantity * p.rate), 0);
            const tot = pkgTotal + (l.perTicketRate || 0);

            const calcComm = l.commissionPercentage ? (tot * l.commissionPercentage / 100) : 0;
            let finalComm = comm || calcComm;

            if (finalComm === 0 && (l.status === 'Confirmed' || l.paymentConfirmationStatus === 'CONFIRMED') && paid > 0 && paid < tot) {
                const implied = tot - paid;
                if (implied > 0) finalComm = implied;
            }
            l.commissionAmount = finalComm;
        });

        // Calculate the total collected amount to distribute (simplified: add to first lead or distribute? Add to first for now)
        let remainingCollected = collectedNow;

        (virtualData.checkedInQuantities || []).forEach(virtualCq => {
            let remainingToDistribute = virtualCq.quantity;
            updatedLeads.forEach(lead => {
                const leadPkg = lead.packageQuantities?.find(p => p.packageId === virtualCq.packageId);
                const maxCap = leadPkg?.quantity || 0;
                let leadCq = lead.checkedInQuantities?.find(c => c.packageId === virtualCq.packageId);
                if (!leadCq) {
                    if (!lead.checkedInQuantities) lead.checkedInQuantities = [];
                    leadCq = { packageId: virtualCq.packageId, quantity: 0 };
                    lead.checkedInQuantities.push(leadCq);
                }
                if (remainingToDistribute > 0) {
                    const take = Math.min(remainingToDistribute, maxCap);
                    leadCq.quantity = take;
                    remainingToDistribute -= take;
                } else {
                    leadCq.quantity = 0;
                }
            });
        });

        // Update financial info on the FIRST lead (Virtual Lead Concept)
        // We accumulate all financial changes (upgrades, addons, collection) to the first lead 
        // because determining which lead to split value across is ambiguous in merged view.
        if (updatedLeads.length > 0) {
            const primaryLead = updatedLeads[0];

            // 1. Update Package Quantities (Handle both Additions and Reductions)
            // We ensure the saved booking exactly matches the Virtual View (User's selection)

            // Get all unique package IDs involved (from virtual and original)
            const allPkgIds = new Set<string>();
            virtualData.packageQuantities?.forEach(p => allPkgIds.add(p.packageId));
            leads.forEach(l => l.packageQuantities?.forEach(p => allPkgIds.add(p.packageId)));

            allPkgIds.forEach(pkgId => {
                const targetQty = virtualData.packageQuantities?.find(p => p.packageId === pkgId)?.quantity || 0;

                // Calculate current total in DB leads (before this save)
                // Note: We use 'leads' array which holds the state before recent mutations in this function?
                // Actually 'updatedLeads' contains dirty state if we mutated it? 
                // We haven't mutated package quantities yet in this block. 'updatedLeads' reflects 'leads' clones.
                let currentTotal = updatedLeads.reduce((sum, l) => sum + (l.packageQuantities?.find(p => p.packageId === pkgId)?.quantity || 0), 0);

                let diff = targetQty - currentTotal;

                if (diff > 0) {
                    // ADDITION: Add to Primary Lead
                    let pPkg = primaryLead.packageQuantities?.find(p => p.packageId === pkgId);
                    if (!pPkg) {
                        if (!primaryLead.packageQuantities) primaryLead.packageQuantities = [];
                        // Find package details (name/rate) from virtualData or fallbacks
                        const sourcePkg = virtualData.packageQuantities?.find(p => p.packageId === pkgId)
                            || leads.flatMap(l => l.packageQuantities || []).find(p => p.packageId === pkgId);

                        pPkg = {
                            packageId: pkgId,
                            packageName: sourcePkg?.packageName || 'Unknown',
                            rate: sourcePkg?.rate || 0,
                            quantity: 0
                        };
                        primaryLead.packageQuantities.push(pPkg);
                    }
                    pPkg.quantity += diff;
                } else if (diff < 0) {
                    // REDUCTION: Remove from leads until satisfied
                    let toRemove = Math.abs(diff);
                    for (const lead of updatedLeads) {
                        if (toRemove <= 0) break;
                        const pkg = lead.packageQuantities?.find(p => p.packageId === pkgId);
                        if (pkg && pkg.quantity > 0) {
                            const taking = Math.min(pkg.quantity, toRemove);
                            pkg.quantity -= taking;
                            toRemove -= taking;
                        }
                    }
                }
            });

            // 2. Update Add-on Amount
            if (virtualData.perTicketRate && virtualData.perTicketRate !== originalVirtualData.perTicketRate) {
                primaryLead.perTicketRate = (primaryLead.perTicketRate || 0) + (virtualData.perTicketRate - (leads.reduce((s, l) => s + (l.perTicketRate || 0), 0)));
                // Actually, logic is tricky. Just SET primary to hold the diff? 
                // Let's set primaryLead.perTicketRate to virtualData.perTicketRate (assuming others are 0 or included). 
                // Simpler: Just update primary lead's total/net to match the Calculated Delta.
            }
            // For robustness, Re-calculate Primary Lead's financials based on its content + collected

            // Apply Collection to Paid Amount
            primaryLead.paidAmount = (primaryLead.paidAmount || 0) + collectedNow;
            // Also track what was collected specifically at check-in (persistent field)
            primaryLead.collectedAtCheckIn = (primaryLead.collectedAtCheckIn || 0) + collectedNow;

            // Re-calculate Totals for Primary Lead specifically
            // We need to trust the API/Backend to recalculate? No, we send values.
            // We updated Primary Lead's Packages. Let's recalc its own total.
            let pTotal = (primaryLead.packageQuantities || []).reduce((sum, p) => sum + (p.quantity * p.rate), 0);

            // Add global Addon to primary
            // If virtualData.perTicketRate is the GLOBAL addon amount:
            // We assign it to primary lead.
            primaryLead.perTicketRate = virtualData.perTicketRate;
            if (primaryLead.perTicketRate) pTotal += primaryLead.perTicketRate;

            primaryLead.totalAmount = pTotal;

            // Net Amount: Total - Commission (Keep existing comm amt? or Recalc? Safe to keep fixed unless we know rate)
            // We'll assume Commission Amount is fixed (no comm on upgrades).
            // So New Net = New Total - Old Comm
            const pComm = primaryLead.commissionAmount || 0;
            primaryLead.netAmount = primaryLead.totalAmount - pComm;

            // Balance
            primaryLead.balanceAmount = primaryLead.netAmount - primaryLead.paidAmount;

            primaryLead.notes = (primaryLead.notes || '') + noteLog;
        }

        // Status updates...
        updatedLeads.forEach(lead => {
            // (Keep existing status logic)
            if (virtualData.yacht !== originalVirtualData.yacht) lead.yacht = virtualData.yacht;
            if (virtualData.clientName !== originalVirtualData.clientName) lead.clientName = virtualData.clientName;

            const totBooked = (lead.packageQuantities || []).reduce((s, p) => s + p.quantity, 0);
            const totChecked = (lead.checkedInQuantities || []).reduce((s, c) => s + c.quantity, 0);

            if (finalLock) {
                lead.checkInStatus = 'Checked In';
                lead.status = 'Checked In';
            } else {
                if (totChecked === 0) lead.checkInStatus = 'Not Checked In';
                else if (totChecked >= totBooked) lead.checkInStatus = 'Checked In';
                else lead.checkInStatus = 'Partially Checked In';

                if (totChecked > 0 && (lead.status === 'Confirmed' || lead.status === 'Closed (Won)')) {
                    lead.status = 'In Progress';
                }
            }
        });

        try {
            await Promise.all(updatedLeads.map(lead =>
                fetch('/api/check-in', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ leadId: lead.id, action: 'sync-check-in', leadData: lead }),
                }).then(res => { if (!res.ok) throw new Error(`Failed to save ${lead.id}`); })
            ));

            setLeads(updatedLeads);
            const newVirtual = calculateVirtualLead(updatedLeads);
            setVirtualData(newVirtual);
            setOriginalVirtualData(JSON.parse(JSON.stringify(newVirtual)));
            setManualComment('');
            setCollectedNow(0); // Reset collection after save
            setNewAddonInput(''); // Reset add-on input

            toast({
                title: finalLock ? "Guests Checked In" : "Progress Saved",
                description: `Updated ${updatedLeads.length} linked booking(s).`,
                className: "bg-green-600 text-white"
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update one or more bookings.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };


    const updateCheckedInQty = (packageId: string, delta: number) => {
        const currentCheckIn = virtualData.checkedInQuantities || [];
        const existing = currentCheckIn.find(c => c.packageId === packageId);
        const booked = virtualData.packageQuantities?.find(p => p.packageId === packageId)?.quantity || 0;

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
        setVirtualData({ ...virtualData, checkedInQuantities: newList });
    };

    const updateBookedQty = (packageId: string, delta: number) => {
        // NOTE: Modifying BOOKED quantity in merged view is complex. 
        // We'd need to know WHICH lead to add to. Default to Primary Lead [0].
        const packages = [...(virtualData.packageQuantities || [])];
        const idx = packages.findIndex(p => p.packageId === packageId);
        if (idx === -1) return;

        packages[idx] = { ...packages[idx], quantity: Math.max(0, packages[idx].quantity + delta) };

        // Recalculate financials (Simplified)
        // Recalculate financials (Simplified)
        const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + (virtualData.perTicketRate || 0);
        // Note: Real financial recalc needs rigorous per-lead logic, this is a visual approximation for the card

        // Fix: Update Net Amount too so it flows to "Current Due"
        const commission = virtualData.commissionAmount || 0;
        const netAmount = totalAmount - commission;

        setVirtualData({
            ...virtualData,
            packageQuantities: packages,
            totalAmount,
            netAmount
        });
    };

    const addPackage = (packageId: string) => {
        if (!yachts.length) return;
        const yacht = yachts.find(y => y.id === virtualData.yacht);
        const pkg = yacht?.packages?.find(p => p.id === packageId);
        if (!pkg) return;

        const packages = [...(virtualData.packageQuantities || [])];
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

        const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + (virtualData.perTicketRate || 0);
        const commission = virtualData.commissionAmount || 0;
        const netAmount = totalAmount - commission;

        setVirtualData({
            ...virtualData,
            packageQuantities: packages,
            totalAmount,
            netAmount
        });
    };


    const isLocked = virtualData.status === 'Checked In' || virtualData.status === 'Completed';
    const netAdjustment = virtualData.netAmount - (originalVirtualData?.netAmount || virtualData.netAmount);

    // Balance Due = (Current Total - Commission) - (Original Paid + Collected Now)
    // We approximate Current Total - Comm as Current Net Amount (if we updated logic correctly)
    // But currently updateBookedQty updates 'totalAmount' only.
    // Let's rely on: Current Total - (Original Total - Original Net [Comm]) - (Original Paid + Collected Now)

    // Simpler: Current Net (assuming 0 comm on upgrades) = Current Total - (Original Total - Original Net)
    const impliedCurrentNet = virtualData.totalAmount - ((originalVirtualData.totalAmount || 0) - (originalVirtualData.netAmount || 0));
    const balanceDue = impliedCurrentNet - ((originalVirtualData.paidAmount || 0) + collectedNow);

    const data = virtualData;

    return (
        <Card className={`border-l-4 shadow-md ${isLocked ? 'border-l-blue-500' : data.checkInStatus === 'Checked In' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/10">
                {/* ... Header Content ... (Assume unchanged) */}
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <Input
                            value={data.clientName}
                            onChange={(e) => setVirtualData({ ...data, clientName: e.target.value })}
                            className="h-7 w-48 font-bold text-lg bg-transparent border-none focus-visible:ring-1 p-0 px-1"
                            disabled={isLocked}
                        />
                        {isLocked && <Badge variant="secondary" className="h-5 text-[10px]"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>}
                    </div>
                    <div className="flex flex-col">
                        {leads.length > 1 && <span className="text-[9px] text-blue-600 font-bold uppercase">Merged Booking ({leads.length})</span>}
                        <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]" title={data.transactionId}>TCKT: {data.transactionId || data.id}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={data.bookingRefNo}>DO: {data.bookingRefNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                    <div className="mr-3">
                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Payment Status</p>
                        <Badge variant={balanceDue > 0 ? "destructive" : "default"} className={`font-bold ${balanceDue > 0 ? "bg-red-100 text-red-800 hover:bg-red-200 border-red-200" : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"}`}>
                            {balanceDue > 0 ? `Unpaid / Balance` : "Fully Paid"}
                        </Badge>
                    </div>
                    {/* ... Rest of Header ... */}
                    <div className="hidden md:block border-l pl-3 mr-2">
                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Event Date</p>
                        <p className={`text-xs font-semibold ${(() => {
                            if (!isValid(parseISO(data.month))) return "";
                            const date = parseISO(data.month);
                            const today = new Date();
                            if (isSameDay(date, today)) return "text-green-600 font-bold";
                            if (startOfDay(date) < startOfDay(today)) return "text-orange-500 font-bold";
                            return "text-red-600 font-bold";
                        })()}`}>
                            {isValid(parseISO(data.month)) ? format(parseISO(data.month), 'dd MMM yyyy') : 'N/A'}
                        </p>
                    </div>
                    <div className="border-l pl-3">
                        <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Arrival Status</p>
                        <Badge variant={data.checkInStatus === 'Checked In' ? "default" : "outline"} className={data.checkInStatus === 'Checked In' ? "bg-green-600 text-white h-6" : data.checkInStatus === 'Partially Checked In' ? "bg-orange-100 text-orange-800 border-orange-200 h-6" : "bg-yellow-100 text-yellow-800 border-yellow-200 h-6"}>{data.checkInStatus}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {/* ... Summary Info ... */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border mb-2">
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Boat Name</p><p className="font-semibold text-sm truncate" title={yachts.find(y => y.id === data.yacht)?.name || data.yacht}>{yachts.find(y => y.id === data.yacht)?.name || data.yacht || 'Not Selected'}</p></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Guest Name</p><p className="font-semibold text-sm truncate" title={data.clientName}>{data.clientName}</p></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">No. of Tickets</p><div className="flex items-baseline gap-1"><p className="font-semibold text-sm">{(data.packageQuantities || []).reduce((sum, p) => sum + p.quantity, 0)}</p><span className="text-[10px] text-muted-foreground">Pax</span></div></div>
                    <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Ticket Number</p><p className="font-mono text-sm font-medium">{data.transactionId || 'N/A'}</p>{data.bookingRefNo && data.bookingRefNo !== data.transactionId && (<p className="text-[10px] text-muted-foreground">Ref: {data.bookingRefNo}</p>)}</div>
                </div>

                {/* ... Selectors ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/20 rounded-md border space-y-2"><p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">Boat / Yacht</p><Select disabled={isLocked} value={data.yacht} onValueChange={(val) => setVirtualData({ ...data, yacht: val })}><SelectTrigger className="h-9 bg-white"><SelectValue /></SelectTrigger><SelectContent>{yachts.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-md border border-blue-100 space-y-2"><p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase flex items-center gap-1"><Plus className="h-3 w-3" /> Upgrade / Add Package</p><Select disabled={isLocked} onValueChange={(val) => addPackage(val)}><SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Add new package..." /></SelectTrigger><SelectContent>{yachts.find(y => y.id === data.yacht)?.packages?.map(p => (<SelectItem key={p.id} value={p.id}>{p.name} (AED {p.rate})</SelectItem>))}</SelectContent></Select></div>
                </div>

                {/* ... Package List ... */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase px-2"><span>Package Name</span><div className="flex gap-12 mr-16"><span className="w-20 text-center">Booked</span><span className="w-20 text-center text-green-700">Arrived</span></div></div>
                    <div className="space-y-1.5">
                        {data.packageQuantities?.filter(p => p.quantity > 0 || (data.checkedInQuantities?.find(c => c.packageId === p.packageId)?.quantity || 0) > 0).map((pkg) => {
                            const checkedIn = (data.checkedInQuantities || []).find((c: any) => c.packageId === pkg.packageId)?.quantity || 0;
                            return (
                                <div key={pkg.packageId} className="px-3 py-2 bg-white dark:bg-slate-900 rounded-md border shadow-sm flex items-center justify-between group">
                                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold truncate">{pkg.packageName}</p><p className="text-[10px] text-muted-foreground whitespace-nowrap">AED {pkg.rate}/ea</p></div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-muted/30 rounded border p-0.5"><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateBookedQty(pkg.packageId, -1)} disabled={isLocked || pkg.quantity <= 0}>-</Button><span className="w-7 text-center text-xs font-bold">{pkg.quantity}</span><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateBookedQty(pkg.packageId, 1)} disabled={isLocked}><Plus className="h-3 w-3" /></Button></div>
                                        <div className="flex items-center bg-green-50 dark:bg-green-950/30 rounded border border-green-200 p-0.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-green-700" onClick={() => updateCheckedInQty(pkg.packageId, -1)} disabled={isLocked || checkedIn <= 0}>-</Button><span className="w-7 text-center text-xs font-bold text-green-700">{checkedIn}</span><Button size="icon" variant="ghost" className="h-6 w-6 text-green-700" onClick={() => updateCheckedInQty(pkg.packageId, 1)} disabled={isLocked || checkedIn >= pkg.quantity}><Plus className="h-3 w-3" /></Button></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/20 rounded-md border space-y-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">Add-ons / Misc Amount (AED)</p>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={newAddonInput}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNewAddonInput(val);
                                const delta = val === '' ? 0 : parseFloat(val);
                                const originalAddon = originalVirtualData.perTicketRate || 0;
                                const newTotalAddon = originalAddon + delta;

                                const packages = data.packageQuantities || [];
                                const totalAmount = packages.reduce((sum, p) => sum + (p.quantity * p.rate), 0) + newTotalAddon;

                                // Fix: Must also update Net Amount so Current Due reflects the change
                                const commission = data.commissionAmount || 0;
                                const netAmount = totalAmount - commission;

                                setVirtualData({ ...data, perTicketRate: newTotalAddon, totalAmount, netAmount });
                            }}
                            disabled={isLocked}
                            className="bg-white font-mono font-bold"
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border space-y-4">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground border-b pb-2">Financial Calculation</h4>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 text-sm">

                        {/* 1. Original Fund (Original Net Amount) */}
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase">Original Fund</p>
                            <p className="font-mono font-medium text-slate-500">AED {(originalVirtualData.netAmount || 0).toLocaleString()}</p>
                        </div>

                        {/* 2. Package Cost (Current Total of Packages) */}
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase">Package Cost</p>
                            <p className="font-mono font-medium">AED {(data.packageQuantities?.reduce((sum, p) => sum + (p.quantity * p.rate), 0) || 0).toLocaleString()}</p>
                        </div>

                        {/* 3. Existing Add-ons (From Original) */}
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase">Existing Add-ons</p>
                            <p className="font-mono font-medium text-slate-500">AED {(originalVirtualData.perTicketRate || 0).toLocaleString()}</p>
                        </div>

                        {/* 4. New Add-ons (Delta) */}
                        <div className="space-y-1 bg-yellow-50/50 p-1 rounded -m-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold text-yellow-700">New Add-ons</p>
                            <p className="font-mono font-bold text-yellow-700">
                                AED {((data.perTicketRate || 0) - (originalVirtualData.perTicketRate || 0)).toLocaleString()}
                            </p>
                        </div>

                        {/* 4. Current Due (New Net - Original Paid) */}
                        <div className="space-y-1 bg-blue-50/50 p-1 rounded -m-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold text-blue-700">Current Due</p>
                            {(() => {
                                const currentNet = data.netAmount || 0;
                                const originalPaid = originalVirtualData.paidAmount || 0; // Use original paid, so we don't double count collectedNow yet
                                // Actually data.paidAmount is NOT updated with collectedNow until Save. 
                                // But data.paidAmount MIGHT include updates if we saved previously? 
                                // data.paidAmount comes from virtualData which comes from leads.
                                // If we haven't saved, data.paidAmount == originalVirtualData.paidAmount.

                                const due = currentNet - (data.paidAmount || 0);
                                return (
                                    <p className="font-mono font-bold text-blue-700">
                                        AED {due.toLocaleString()}
                                    </p>
                                );
                            })()}
                        </div>

                        {/* 5. Pay Now (Collected Now Input) */}
                        <div className="space-y-1 bg-green-50/50 p-1 rounded border border-green-200 -m-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold text-green-700">Pay Now</p>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={collectedNow || ''}
                                onChange={(e) => setCollectedNow(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                disabled={isLocked}
                                className="h-8 bg-white font-mono font-bold text-green-700 border-green-200"
                            />
                        </div>

                        {/* 6. New Balance (Remaining) */}
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase">New Balance</p>
                            {(() => {
                                const currentNet = data.netAmount || 0;
                                const currentPaidTotal = (data.paidAmount || 0) + collectedNow;
                                const remaining = currentNet - currentPaidTotal;

                                return (
                                    <p className={`font-mono text-lg font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        AED {Math.max(0, remaining).toLocaleString()}
                                    </p>
                                );
                            })()}
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
        </Card >
    );
}
