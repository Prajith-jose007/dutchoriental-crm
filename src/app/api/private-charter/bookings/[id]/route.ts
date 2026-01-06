
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatToMySQLDate, formatToMySQLDateTime } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const results = await query<any[]>('SELECT * FROM pc_bookings WHERE id = ?', [id]);
        if (results.length === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
        const row = results[0];
        return NextResponse.json({
            ...row,
            checkInTime: row.checkInTime?.toISOString(),
            createdAt: row.createdAt?.toISOString(),
            updatedAt: row.updatedAt?.toISOString(),
        });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const sql = `
      UPDATE pc_bookings SET
        leadId = ?, customerId = ?, yachtId = ?, tripDate = ?, startTime = ?, 
        endTime = ?, totalHours = ?, location = ?, guestsCount = ?, status = ?,
        captainName = ?, crewDetails = ?, idVerified = ?, checkInTime = ?, 
        extraHoursUsed = ?, extraCharges = ?, customerSignature = ?
      WHERE id = ?
    `;
        const params = [
            body.leadId, body.customerId, body.yachtId, formatToMySQLDate(body.tripDate), body.startTime,
            body.endTime, body.totalHours, body.location, body.guestsCount, body.status,
            body.captainName, body.crewDetails, body.idVerified, formatToMySQLDateTime(body.checkInTime),
            body.extraHoursUsed, body.extraCharges, body.customerSignature, id
        ].map(p => p === undefined ? null : p);

        await query(sql, params);
        return NextResponse.json({ message: 'Updated' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await query('DELETE FROM pc_bookings WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
