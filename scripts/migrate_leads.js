
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const missingColumns = [
    { name: 'customAgentName', type: 'VARCHAR(255)' },
    { name: 'customAgentPhone', type: 'VARCHAR(50)' },
    { name: 'perTicketRateReason', type: 'TEXT' },
    { name: 'noShowCount', type: 'INT DEFAULT 0' },
    { name: 'durationHours', type: 'DECIMAL(5,2)' },
    { name: 'budgetRange', type: 'VARCHAR(255)' },
    { name: 'occasion', type: 'VARCHAR(255)' },
    { name: 'priority', type: 'VARCHAR(50)' },
    { name: 'nextFollowUpDate', type: 'DATETIME' },
    { name: 'closingProbability', type: 'INT DEFAULT 0' },
    { name: 'captainName', type: 'VARCHAR(255)' },
    { name: 'crewDetails', type: 'TEXT' },
    { name: 'idVerified', type: 'BOOLEAN DEFAULT FALSE' },
    { name: 'extraHoursUsed', type: 'DECIMAL(5,2) DEFAULT 0' },
    { name: 'extraCharges', type: 'DECIMAL(10,2) DEFAULT 0' },
    { name: 'collectedAtCheckIn', type: 'DOUBLE DEFAULT 0' }
];

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        console.log('Starting migration check...');
        const [columns] = await connection.query('DESCRIBE leads');
        const existingColumns = columns.map(c => c.Field);

        for (const col of missingColumns) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                await connection.query(`ALTER TABLE leads ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }
        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();
