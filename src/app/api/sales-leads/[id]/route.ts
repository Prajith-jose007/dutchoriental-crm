
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatToMySQLDateTime } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const results = await query<any[]>('SELECT * FROM sales_leads WHERE id = ?', [id]);
        if (results.length === 0) {
            return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        }
        return NextResponse.json(results[0]);
    } catch (error) {
        console.error('[Sales Lead GET ID]', error);
        return NextResponse.json({ message: 'Error fetching Sales lead' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const sql = `
      UPDATE sales_leads SET 
        clientName = ?, email = ?, phone = ?, subject = ?, message = ?, source = ?, 
        status = ?, priority = ?, preferredDate = ?, paxCount = ?, assignedTo = ?, notes = ?
      WHERE id = ?
    `;

        const queryParams = [
            body.clientName, body.email, body.phone, body.subject, body.message, body.source,
            body.status, body.priority,
            body.preferredDate ? formatToMySQLDateTime(body.preferredDate) : null,
            body.paxCount, body.assignedTo, body.notes,
            id
        ];

        await query(sql, queryParams);
        return NextResponse.json({ message: 'Lead updated successfully' });
    } catch (error) {
        console.error('[Sales Lead PUT ID]', error);
        return NextResponse.json({ message: 'Error updating Sales lead' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await query('DELETE FROM sales_leads WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('[Sales Lead DELETE ID]', error);
        return NextResponse.json({ message: 'Error deleting Sales lead' }, { status: 500 });
    }
}
