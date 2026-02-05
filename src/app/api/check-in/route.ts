
import { NextResponse, type NextRequest } from 'next/server';
import type { Lead, LeadPackageQuantity, LeadStatus, LeadType, PaymentConfirmationStatus, ModeOfPayment } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, isValid, parseISO } from 'date-fns';
import { formatToMySQLDateTime } from '@/lib/utils';

// Minimal DbLead interface for this endpoint
interface DbLead {
    id: string;
    clientName: string;
    agent: string;
    yacht: string;
    status: string;
    month: string;
    notes?: string;
    type: string;
    paymentConfirmationStatus: string;
    transactionId?: string;
    bookingRefNo?: string;
    modeOfPayment: string;
    package_quantities_json?: string;
    freeGuestCount: number;
    perTicketRate?: number | null;
    totalAmount: number;
    commissionPercentage: number;
    commissionAmount: number;
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    createdAt: string;
    updatedAt: string;
    lastModifiedByUserId?: string;
    ownerUserId?: string;
    checkInStatus?: string;
    checkInTime?: string;
    free_guest_details_json?: string;
    checked_in_quantities_json?: string;
    collectedAtCheckIn?: number;
}

const ensureISOFormat = (dateSource?: string | Date): string | null => {
    if (!dateSource) return null;
    if (dateSource instanceof Date) return isValid(dateSource) ? formatISO(dateSource) : null;
    try {
        const parsed = parseISO(dateSource);
        return isValid(parsed) ? formatISO(parsed) : dateSource;
    } catch {
        return dateSource;
    }
};

const mapDbLeadToLeadObject = (dbLead: DbLead): Lead => {
    let packageQuantities: LeadPackageQuantity[] = [];
    if (dbLead.package_quantities_json && typeof dbLead.package_quantities_json === 'string') {
        try {
            packageQuantities = JSON.parse(dbLead.package_quantities_json);
        } catch (e) {
            console.warn(`[Check-In API] Failed to parse package_quantities_json for lead ${dbLead.id}`, e);
        }
    }

    let freeGuestDetails: any[] = [];
    if (dbLead.free_guest_details_json && typeof dbLead.free_guest_details_json === 'string') {
        try {
            freeGuestDetails = JSON.parse(dbLead.free_guest_details_json);
        } catch (e) {
            console.warn(`[Check-In API] Failed to parse free_guest_details_json for lead ${dbLead.id}`, e);
        }
    }

    let checkedInQuantities: any[] = [];
    if (dbLead.checked_in_quantities_json && typeof dbLead.checked_in_quantities_json === 'string') {
        try {
            checkedInQuantities = JSON.parse(dbLead.checked_in_quantities_json);
        } catch (e) {
            console.warn(`[Check-In API] Failed to parse checked_in_quantities_json for lead ${dbLead.id}`, e);
        }
    }

    return {
        id: String(dbLead.id || ''),
        clientName: String(dbLead.clientName || ''),
        agent: String(dbLead.agent || ''),
        yacht: String(dbLead.yacht || ''),
        status: (dbLead.status || 'Balance') as LeadStatus,
        month: ensureISOFormat(dbLead.month)!,
        notes: dbLead.notes || undefined,
        type: (dbLead.type || 'Private Cruise') as LeadType,
        paymentConfirmationStatus: (dbLead.paymentConfirmationStatus || 'UNCONFIRMED') as PaymentConfirmationStatus,
        transactionId: dbLead.transactionId || undefined,
        bookingRefNo: dbLead.bookingRefNo || undefined,
        modeOfPayment: (dbLead.modeOfPayment || 'CARD') as ModeOfPayment,
        packageQuantities,
        freeGuestCount: Number(dbLead.freeGuestCount || 0),
        perTicketRate: dbLead.perTicketRate !== null && dbLead.perTicketRate !== undefined ? Number(dbLead.perTicketRate) : undefined,
        totalAmount: Number(dbLead.totalAmount || 0),
        commissionPercentage: Number(dbLead.commissionPercentage || 0),
        commissionAmount: Number(dbLead.commissionAmount || 0),
        netAmount: Number(dbLead.netAmount || 0),
        paidAmount: Number(dbLead.paidAmount || 0),
        collectedAtCheckIn: Number(dbLead.collectedAtCheckIn || 0),
        balanceAmount: Number(dbLead.balanceAmount || 0),
        createdAt: ensureISOFormat(dbLead.createdAt)!,
        updatedAt: ensureISOFormat(dbLead.updatedAt)!,
        lastModifiedByUserId: dbLead.lastModifiedByUserId || undefined,
        ownerUserId: dbLead.ownerUserId || undefined,
        checkInStatus: (dbLead.checkInStatus as 'Checked In' | 'Not Checked In' | 'Partially Checked In') || 'Not Checked In',
        checkInTime: ensureISOFormat(dbLead.checkInTime) || undefined,
        freeGuestDetails,
        checkedInQuantities,
    };
};

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const queryParam = searchParams.get('query');

    if (!queryParam) {
        return NextResponse.json({ message: 'Query parameter is required.' }, { status: 400 });
    }

    try {
        // 1. Initial Search: Find leads matching the input (Transaction ID, Ref No, or ID)
        // AND exclude Canceled bookings
        const initialSearchSql = `
            SELECT * FROM leads 
            WHERE (transactionId = ? OR bookingRefNo = ? OR id = ?)
            AND status != 'Canceled'
        `;
        const initialMatches = await query<DbLead[]>(initialSearchSql, [queryParam, queryParam, queryParam]);

        if (initialMatches.length === 0) {
            return NextResponse.json({ message: 'Booking not found.' }, { status: 404 });
        }

        // 2. Expand Search: If a Booking Ref exists, get ALL leads for that booking
        //    (This ensures scanning one ticket shows the whole group if they are split)
        const bookingRefNo = initialMatches[0].bookingRefNo;
        let finalResults = initialMatches;

        if (bookingRefNo) {
            const groupSql = `
                SELECT * FROM leads 
                WHERE bookingRefNo = ?
                AND status != 'Canceled'
                ORDER BY id ASC
            `;
            finalResults = await query<DbLead[]>(groupSql, [bookingRefNo]);
        }

        const leads = finalResults.map(mapDbLeadToLeadObject);
        return NextResponse.json(leads, { status: 200 });

    } catch (error) {
        console.error('[API GET /api/check-in] Search Error:', error);
        return NextResponse.json({ message: 'Internal server error during search.' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { leadId, action, leadData } = body;

        if (!leadId || !action) {
            return NextResponse.json({ message: 'Lead ID and action are required.' }, { status: 400 });
        }

        if (action === 'sync-check-in' && leadData) {
            // Full sync of check-in data including partial quantities and potential package updates
            const {
                checkedInQuantities,
                checkInStatus,
                packageQuantities,
                totalAmount,
                commissionAmount,
                netAmount,
                balanceAmount,
                paidAmount,
                collectedAtCheckIn,
                status,
                yacht,
                clientName,
                notes
            } = leadData;

            const now = formatToMySQLDateTime(new Date());
            const sql = `
                UPDATE leads SET 
                    checked_in_quantities_json = ?, 
                    checkInStatus = ?, 
                    checkInTime = COALESCE(checkInTime, ?),
                    package_quantities_json = ?,
                    totalAmount = ?,
                    commissionAmount = ?,
                    netAmount = ?,
                    balanceAmount = ?,
                    paidAmount = ?,
                    collectedAtCheckIn = ?,
                    status = ?,
                    yacht = ?,
                    clientName = ?,
                    notes = ?,
                    updatedAt = ?
                WHERE id = ?
            `;

            await query(sql, [
                JSON.stringify(checkedInQuantities || []),
                checkInStatus,
                checkInStatus !== 'Not Checked In' ? now : null,
                JSON.stringify(packageQuantities || []),
                totalAmount,
                commissionAmount,
                netAmount,
                balanceAmount,
                paidAmount,
                collectedAtCheckIn,
                status,
                yacht,
                clientName,
                notes || null,
                now,
                leadId
            ]);

            return NextResponse.json({ message: 'Sync successful', checkInStatus, checkInTime: now });
        }

        if (action === 'check-in') {
            const now = formatToMySQLDateTime(new Date());
            const sql = 'UPDATE leads SET checkInStatus = ?, checkInTime = ? WHERE id = ?';
            await query(sql, ['Checked In', now, leadId]);
            return NextResponse.json({ message: 'Check-in successful', checkInStatus: 'Checked In', checkInTime: now });
        } else if (action === 'undo-check-in') {
            const sql = 'UPDATE leads SET checkInStatus = ?, checkInTime = NULL, checked_in_quantities_json = NULL WHERE id = ?';
            await query(sql, ['Not Checked In', leadId]);
            return NextResponse.json({ message: 'Check-in undone', checkInStatus: 'Not Checked In' });
        } else {
            return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
        }

    } catch (error) {
        console.error('[API POST /api/check-in] Action Error:', error);
        return NextResponse.json({ message: 'Internal server error during check-in action.' }, { status: 500 });
    }
}
