
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function scanEverything() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        const [dbs] = await connection.query('SHOW DATABASES');
        for (const dbRow of dbs) {
            const dbName = dbRow.Database;
            if (['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) continue;

            await connection.query(`USE \`${dbName}\``);
            const [tables] = await connection.query('SHOW TABLES');

            for (const tableRow of tables) {
                const tableName = Object.values(tableRow)[0];
                try {
                    const [cols] = await connection.query(`DESCRIBE \`${tableName}\``);
                    const colNames = cols.map(c => c.Field);
                    if (tableName.toLowerCase().includes('lead') || tableName.toLowerCase().includes('booking')) {
                        console.log(`DB: ${dbName}, Table: ${tableName}, has customAgentName: ${colNames.includes('customAgentName')}`);
                    }
                } catch (e) { }
            }
        }
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await connection.end();
    }
}

scanEverything();
