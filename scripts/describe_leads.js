
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
        const [rows] = await connection.query('DESCRIBE leads');
        console.log(rows.map(r => r.Field));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
