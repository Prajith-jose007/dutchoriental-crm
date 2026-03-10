
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        const [rows] = await connection.query('SELECT id, name FROM agents');
        rows.forEach(row => {
            if (row.id.trim() !== row.id) {
                console.log(`FOUND UNTRIMMED ID: "${row.id}" for agent "${row.name}"`);
            }
            if (row.id.includes('/') || row.id.includes('?') || row.id.includes('#')) {
                console.log(`FOUND PROBLEMATIC ID (URL CHARS): "${row.id}" for agent "${row.name}"`);
            }
        });
        console.log(`Checked ${rows.length} agents.`);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
