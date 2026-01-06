
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { formatToMySQLDateTime } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const results = await query<any[]>('SELECT * FROM pc_leads WHERE id = ?', [id]);
        if (results.length === 0) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        const row = results[0];
        const lead = {
            ...row,
            inquiryDate: row.inquiryDate?.toISOString(),
            preferredDate: row.preferredDate?.toISOString(),
            nextFollowUpDate: row.nextFollowUpDate?.toISOString(),
            createdAt: row.createdAt?.toISOString(),
            updatedAt: row.updatedAt?.toISOString(),
        };
        return NextResponse.json(lead);
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching lead' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await req.json();
        const sql = `
      UPDATE pc_leads SET
        firstName = ?, lastName = ?, phone = ?, email = ?, nationality = ?, language = ?, 
        source = ?, inquiryDate = ?, yachtType = ?, adultsCount = ?, kidsCount = ?, 
        durationHours = ?, preferredDate = ?, budgetRange = ?, occasion = ?, 
        assignedAgentId = ?, status = ?, priority = ?, nextFollowUpDate = ?, notes = ?
      WHERE id = ?
    `;
        const values = [
            body.firstName, body.lastName, body.phone, body.email, body.nationality, body.language,
            body.source, formatToMySQLDateTime(body.inquiryDate), body.yachtType, body.adultsCount, body.kidsCount,
            body.durationHours, formatToMySQLDateTime(body.preferredDate), body.budgetRange, body.occasion,
            body.assignedAgentId, body.status, body.priority, formatToMySQLDateTime(body.nextFollowUpDate), body.notes,
            id
        ].map(p => p === undefined ? null : p);

        await query(sql, values);
        return NextResponse.json({ message: 'Lead updated successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error updating lead' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        await query('DELETE FROM pc_leads WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Error deleting lead' }, { status: 500 });
    }
}
