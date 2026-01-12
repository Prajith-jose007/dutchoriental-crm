
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { SalesLead } from '@/lib/types';
import { formatToMySQLDateTime } from '@/lib/utils';
import { formatISO, isValid, parseISO } from 'date-fns';

const ensureISOFormat = (dateSource?: string | Date): string | null => {
    if (!dateSource) return null;
    if (dateSource instanceof Date) {
        return isValid(dateSource) ? formatISO(dateSource) : null;
    }
    try {
        const parsed = parseISO(dateSource);
        return isValid(parsed) ? formatISO(parsed) : dateSource;
    } catch {
        return dateSource;
    }
};

export async function GET() {
    try {
        const results = await query<any[]>('SELECT * FROM sales_leads ORDER BY createdAt DESC');
        const leads: SalesLead[] = results.map(row => ({
            ...row,
            preferredDate: row.preferredDate ? ensureISOFormat(row.preferredDate) : undefined,
            createdAt: ensureISOFormat(row.createdAt)!,
            updatedAt: ensureISOFormat(row.updatedAt)!,
        }));
        return NextResponse.json(leads);
    } catch (error) {
        console.error('[Sales Leads GET]', error);
        return NextResponse.json({ message: 'Error fetching Sales leads' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const id = body.id || `SL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const sql = `
      INSERT INTO sales_leads (
        id, clientName, email, phone, subject, message, source, status, priority, 
        preferredDate, paxCount, assignedTo, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            id, body.clientName, body.email, body.phone, body.subject, body.message, body.source || 'Website',
            body.status || 'New', body.priority || 'Medium',
            body.preferredDate ? formatToMySQLDateTime(body.preferredDate) : null,
            body.paxCount || 0, body.assignedTo || null, body.notes || null
        ];

        await query(sql, params);

        return NextResponse.json({ message: 'Sales lead created successfully', id }, { status: 201 });
    } catch (error) {
        console.error('[Sales Leads POST]', error);
        return NextResponse.json({ message: 'Error creating Sales lead' }, { status: 500 });
    }
}
