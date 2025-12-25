
import { query, closePool } from '../src/lib/db';
import 'dotenv/config';

async function optimize() {
    try {
        console.log('Optimizing database indexes...');

        const tables = ['leads', 'invoices', 'opportunities', 'agents', 'yachts', 'users'];

        for (const table of tables) {
            console.log(`Checking indexes for ${table}...`);
            try {
                // Add index on createdAt if it exists and isn't indexed
                await query(`ALTER TABLE ${table} ADD INDEX IF NOT EXISTS idx_createdAt (createdAt)`);
            } catch (e) {
                console.log(`Could not add index to ${table}: ${(e as Error).message}`);
            }
        }

        // Specifc indexes
        await query(`ALTER TABLE leads ADD INDEX IF NOT EXISTS idx_type (type)`);
        await query(`ALTER TABLE leads ADD INDEX IF NOT EXISTS idx_month (month)`);
        await query(`ALTER TABLE invoices ADD INDEX IF NOT EXISTS idx_leadId (leadId)`);
        await query(`ALTER TABLE opportunities ADD INDEX IF NOT EXISTS idx_pipelinePhase (pipelinePhase)`);

        console.log('Database optimization complete.');
    } catch (error) {
        console.error('Optimization failed:', error);
    } finally {
        await closePool();
    }
}

optimize();
