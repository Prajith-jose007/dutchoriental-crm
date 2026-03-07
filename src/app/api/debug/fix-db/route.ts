
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

async function addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string, results: any[]) {
    const columnExists = results.some(c => c.Field === columnName);
    if (!columnExists) {
        const alterTableSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`;
        await query(alterTableSql);
        return `✅ Column ${columnName} added.`;
    }
    return `ℹ️ Column ${columnName} exists.`;
}

export async function GET() {
    const logs: string[] = [];
    try {
        logs.push('--- Starting Database Schema Fix via API ---');
        const table = 'leads';

        // Get current structure
        const currentColumns = await query<any[]>(`DESCRIBE \`${table}\``);

        const columnsToEnsure: [string, string][] = [
            ['package_quantities_json', 'JSON'],
            ['free_guest_details_json', 'JSON'],
            ['perTicketRate', 'DECIMAL(10,2)'],
            ['perTicketRateReason', 'TEXT'],
            ['collectedAtCheckIn', 'DECIMAL(10,2) DEFAULT 0'],
            ['customerPhone', 'VARCHAR(255)'],
            ['customerEmail', 'VARCHAR(255)'],
            ['nationality', 'VARCHAR(255)'],
            ['language', 'VARCHAR(255)'],
            ['source', 'VARCHAR(255)'],
            ['inquiryDate', 'DATETIME'],
            ['yachtType', 'VARCHAR(255)'],
            ['adultsCount', 'INT DEFAULT 0'],
            ['kidsCount', 'INT DEFAULT 0'],
            ['durationHours', 'DECIMAL(5,2)'],
            ['budgetRange', 'VARCHAR(255)'],
            ['occasion', 'VARCHAR(255)'],
            ['priority', 'VARCHAR(50)'],
            ['nextFollowUpDate', 'DATETIME'],
            ['closingProbability', 'INT DEFAULT 0'],
            ['captainName', 'VARCHAR(255)'],
            ['crewDetails', 'TEXT'],
            ['idVerified', 'BOOLEAN DEFAULT FALSE'],
            ['extraHoursUsed', 'DECIMAL(5,2) DEFAULT 0'],
            ['extraCharges', 'DECIMAL(10,2) DEFAULT 0'],
            ['customerSignatureUrl', 'TEXT']
        ];

        for (const [col, def] of columnsToEnsure) {
            const msg = await addColumnIfNotExists(table, col, def, currentColumns);
            logs.push(msg);
        }

        // Fix status type
        const statusCol = currentColumns.find(c => c.Field === 'status');
        if (statusCol && statusCol.Type.toLowerCase().includes('enum')) {
            await query(`ALTER TABLE \`${table}\` MODIFY COLUMN \`status\` VARCHAR(100)`);
            logs.push('✅ status column converted from ENUM to VARCHAR(100).');
        }

        logs.push('--- Database Fix Completed Successfully ---');
        return NextResponse.json({ success: true, logs });
    } catch (err: any) {
        logs.push(`❌ ERROR: ${err.message}`);
        return NextResponse.json({ success: false, logs, error: err.message }, { status: 500 });
    }
}
