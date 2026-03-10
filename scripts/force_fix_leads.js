
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function fix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        console.log("Forcing schema update...");
        // Just in case it's a naming collision or something, we drop and recreate
        try { await connection.query("ALTER TABLE leads DROP COLUMN customAgentName"); } catch (e) { }
        try { await connection.query("ALTER TABLE leads DROP COLUMN customAgentPhone"); } catch (e) { }

        await connection.query("ALTER TABLE leads ADD COLUMN customAgentName VARCHAR(255) AFTER source");
        await connection.query("ALTER TABLE leads ADD COLUMN customAgentPhone VARCHAR(50) AFTER customAgentName");

        console.log("Columns successfully recreated.");
    } catch (err) {
        console.error("FIX FAILED:", err.message);
    } finally {
        await connection.end();
    }
}

fix();
