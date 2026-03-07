
import { query, closePool } from '../src/lib/db';
import 'dotenv/config';

async function addColumnIfNotExists(tableName: string, columnName: string, columnDefinition: string) {
    try {
        const checkColumnSql = `
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?;
    `;
        const results: any[] = await query(checkColumnSql, [tableName, columnName]);
        if (results && results.length > 0 && results[0].count === 0) {
            const alterTableSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`;
            await query(alterTableSql);
            console.log(`✅ Column ${columnName} added to table ${tableName}.`);
        } else {
            console.log(`ℹ️ Column ${columnName} already exists in ${tableName}.`);
        }
    } catch (error) {
        console.error(`❌ Error adding column ${columnName} to ${tableName}:`, (error as Error).message);
    }
}

async function runFix() {
    console.log('--- Starting Database Schema Fix ---');

    const leadsTable = 'leads';

    // 1. Missing Financial/Package columns
    await addColumnIfNotExists(leadsTable, 'package_quantities_json', 'JSON');
    await addColumnIfNotExists(leadsTable, 'free_guest_details_json', 'JSON');
    await addColumnIfNotExists(leadsTable, 'perTicketRate', 'DECIMAL(10,2)');
    await addColumnIfNotExists(leadsTable, 'perTicketRateReason', 'TEXT');
    await addColumnIfNotExists(leadsTable, 'collectedAtCheckIn', 'DECIMAL(10,2) DEFAULT 0');

    // 2. Ensure all CRM/Operation columns are present (just in case they missed crm-extension.ts)
    await addColumnIfNotExists(leadsTable, 'customerPhone', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'customerEmail', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'nationality', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'language', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'source', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'inquiryDate', 'DATETIME');
    await addColumnIfNotExists(leadsTable, 'yachtType', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'adultsCount', 'INT DEFAULT 0');
    await addColumnIfNotExists(leadsTable, 'kidsCount', 'INT DEFAULT 0');
    await addColumnIfNotExists(leadsTable, 'durationHours', 'DECIMAL(5,2)');
    await addColumnIfNotExists(leadsTable, 'budgetRange', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'occasion', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'priority', 'VARCHAR(50)');
    await addColumnIfNotExists(leadsTable, 'nextFollowUpDate', 'DATETIME');
    await addColumnIfNotExists(leadsTable, 'closingProbability', 'INT DEFAULT 0');
    await addColumnIfNotExists(leadsTable, 'captainName', 'VARCHAR(255)');
    await addColumnIfNotExists(leadsTable, 'crewDetails', 'TEXT');
    await addColumnIfNotExists(leadsTable, 'idVerified', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfNotExists(leadsTable, 'extraHoursUsed', 'DECIMAL(5,2) DEFAULT 0');
    await addColumnIfNotExists(leadsTable, 'extraCharges', 'DECIMAL(10,2) DEFAULT 0');
    await addColumnIfNotExists(leadsTable, 'customerSignatureUrl', 'TEXT');

    // 3. Update Status Column (Migration from ENUM or older structure)
    // We change it to VARCHAR to avoid ENUM rigidness, or update ENUM. 
    // For safety and compatibility with current app, VARCHAR(100) is better than a potentially restricted ENUM.
    try {
        console.log('Updating status column to VARCHAR(100)...');
        await query(`ALTER TABLE \`${leadsTable}\` MODIFY COLUMN \`status\` VARCHAR(100)`);
        console.log('✅ status column updated to VARCHAR(100).');
    } catch (err) {
        console.warn('⚠️ Could not modify status column. It might already be VARCHAR or in a locked state.', (err as Error).message);
    }

    // 4. Mode of Payment check
    try {
        await query(`ALTER TABLE \`${leadsTable}\` MODIFY COLUMN \`modeOfPayment\` VARCHAR(100)`);
        console.log('✅ modeOfPayment column updated to VARCHAR(100).');
    } catch (err) {
        /* ignore */
    }

    console.log('--- Database Fix Completed ---');
    await closePool();
}

runFix().catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
});
