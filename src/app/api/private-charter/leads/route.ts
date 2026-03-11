
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { PCLead } from '@/lib/pc-types';
import { v4 as uuidv4 } from 'uuid';
import { formatToMySQLDateTime } from '@/lib/utils';

export async function GET(req: NextRequest) {
    try {
        const results = await query<any[]>('SELECT * FROM pc_leads ORDER BY createdAt DESC');
        const leads = results.map(row => ({
            ...row,
            inquiryDate: row.inquiryDate?.toISOString(),
            preferredDate: row.preferredDate?.toISOString(),
            nextFollowUpDate: row.nextFollowUpDate?.toISOString(),
            createdAt: row.createdAt?.toISOString(),
            updatedAt: row.updatedAt?.toISOString(),
        }));
        return NextResponse.json(leads);
    } catch (error) {
        console.error('[PC Leads GET]', error);
        return NextResponse.json({ message: 'Error fetching Private Charter leads' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const id = body.id || `PCL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const sql = `
      INSERT INTO pc_leads (
        id, firstName, lastName, phone, email, nationality, language, source, 
        inquiryDate, yachtType, adultsCount, kidsCount, durationHours, preferredDate, 
        budgetRange, occasion, assignedAgentId, status, priority, nextFollowUpDate, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const params = [
            id, body.firstName, body.lastName, body.phone, body.email, body.nationality, body.language, body.source,
            formatToMySQLDateTime(body.inquiryDate), body.yachtType, body.adultsCount, body.kidsCount, body.durationHours, formatToMySQLDateTime(body.preferredDate),
            body.budgetRange, body.occasion, body.assignedAgentId, body.status || 'New', body.priority || 'Medium',
            formatToMySQLDateTime(body.nextFollowUpDate), body.notes
        ].map(p => p === undefined ? null : p);

        let attempt = 0;
        const maxRetries = 2;
        while (attempt < maxRetries) {
            try {
                await query(sql, params);
                break;
            } catch (err: any) {
                if (err.code === 'ER_BAD_FIELD_ERROR') {
                    console.error(`[PC Leads POST] Missing columns detected. Attempting auto-migration...`);
                    try {
                        const currentCols = await query<any[]>(`DESCRIBE pc_leads`);
                        const existingNames = currentCols.map(c => c.Field);
                        const columnsToAdd = [
                            { name: 'customAgentName', def: 'VARCHAR(255) NULL' },
                            { name: 'customAgentPhone', def: 'VARCHAR(50) NULL' },
                            { name: 'noShowCount', def: 'INT DEFAULT 0' }
                        ];
                        for (const col of columnsToAdd) {
                            if (!existingNames.includes(col.name)) {
                                await query(`ALTER TABLE pc_leads ADD COLUMN ${col.name} ${col.def}`);
                            }
                        }
                        console.log(`[PC Leads POST] Auto-migration successful. Retrying insert...`);
                        attempt++;
                        continue;
                    } catch (migErr) {
                        throw err;
                    }
                } else {
                    throw err;
                }
            }
        }

        return NextResponse.json({ message: 'Lead created successfully', id }, { status: 201 });
    } catch (error) {
        console.error('[PC Leads POST]', error);
        return NextResponse.json({ message: 'Error creating Private Charter lead' }, { status: 500 });
    }
}
