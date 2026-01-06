
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PCQuotation } from '@/lib/pc-types';
import { formatToMySQLDateTime } from '@/lib/utils';

export async function GET(req: NextRequest) {
    try {
        const results = await query<any[]>('SELECT * FROM pc_quotations ORDER BY createdAt DESC');
        const quotations = results.map(row => ({
            ...row,
            addons: JSON.parse(row.addons_json || '{}'),
            validUntil: row.validUntil?.toISOString(),
            createdAt: row.createdAt?.toISOString(),
            updatedAt: row.updatedAt?.toISOString(),
        }));
        return NextResponse.json(quotations);
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const id = `PCQ-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const sql = `
      INSERT INTO pc_quotations (
        id, leadId, yachtId, basePricePerHour, durationHours, subtotal, 
        addons_json, discountAmount, vatAmount, totalAmount, status, validUntil
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            id, body.leadId, body.yachtId, body.basePricePerHour, body.durationHours, body.subtotal,
            JSON.stringify(body.addons || {}), body.discountAmount, body.vatAmount, body.totalAmount,
            body.status || 'Draft', formatToMySQLDateTime(body.validUntil)
        ];

        await query(sql, params);
        return NextResponse.json({ id }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
