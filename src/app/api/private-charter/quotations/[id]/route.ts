
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatToMySQLDateTime } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const results = await query<any[]>('SELECT * FROM pc_quotations WHERE id = ?', [id]);
        if (results.length === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
        const row = results[0];
        return NextResponse.json({
            ...row,
            addons: JSON.parse(row.addons_json || '{}'),
            validUntil: row.validUntil?.toISOString(),
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
      UPDATE pc_quotations SET
        leadId = ?, yachtId = ?, basePricePerHour = ?, durationHours = ?, subtotal = ?, 
        addons_json = ?, discountAmount = ?, vatAmount = ?, totalAmount = ?, status = ?, validUntil = ?
      WHERE id = ?
    `;
        const params = [
            body.leadId, body.yachtId, body.basePricePerHour, body.durationHours, body.subtotal,
            JSON.stringify(body.addons || {}), body.discountAmount, body.vatAmount, body.totalAmount,
            body.status, formatToMySQLDateTime(body.validUntil), id
        ];

        await query(sql, params);
        return NextResponse.json({ message: 'Updated' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await query('DELETE FROM pc_quotations WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Error' }, { status: 500 });
    }
}
