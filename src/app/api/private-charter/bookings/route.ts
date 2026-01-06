
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PCBooking } from '@/lib/pc-types';
import { formatToMySQLDate } from '@/lib/utils';

export async function GET(req: NextRequest) {
    try {
        const results = await query<any[]>('SELECT * FROM pc_bookings ORDER BY tripDate DESC, startTime DESC');
        const bookings = results.map(row => ({
            ...row,
            checkInTime: row.checkInTime?.toISOString(),
            createdAt: row.createdAt?.toISOString(),
            updatedAt: row.updatedAt?.toISOString(),
        }));
        return NextResponse.json(bookings);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const id = `PCB-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const sql = `
      INSERT INTO pc_bookings (
        id, leadId, customerId, yachtId, tripDate, startTime, endTime, totalHours, 
        location, guestsCount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            id, body.leadId, body.customerId, body.yachtId, formatToMySQLDate(body.tripDate), body.startTime,
            body.endTime, body.totalHours, body.location, body.guestsCount, body.status || 'Tentative'
        ];

        await query(sql, params);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
