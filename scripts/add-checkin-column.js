const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function migrate() {
    console.log('Starting Database Update...');
    console.log(`Connecting to database: ${process.env.DB_DATABASE} at ${process.env.DB_HOST}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        });

        console.log('Connected successfully.');

        // Validating if column exists
        const [columns] = await connection.execute(
            `SHOW COLUMNS FROM leads LIKE 'collectedAtCheckIn'`
        );

        if (columns.length > 0) {
            console.log("✅ Column 'collectedAtCheckIn' ALREADY EXISTS. No changes made.");
        } else {
            console.log("Column 'collectedAtCheckIn' not found. Adding it now...");

            // SAFE OPERATION: Adding a column does not delete data
            await connection.execute(
                `ALTER TABLE leads ADD COLUMN collectedAtCheckIn DOUBLE DEFAULT 0`
            );

            console.log("✅ Successfully added column 'collectedAtCheckIn'.");
        }

    } catch (error) {
        console.error('❌ Migration Failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        console.log('Migration script finished.');
        process.exit(0);
    }
}

migrate();
