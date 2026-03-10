
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
        const id = "TEST-AGENT-" + Date.now();
        const [result] = await connection.query(
            `INSERT INTO agents (id, name, email, discount, status) VALUES (?, ?, ?, ?, ?)`,
            [id, "Test Agent", "test@example.com", 10, "Active"]
        );
        console.log("Insert result:", result);

        const [rows] = await connection.query('SELECT * FROM agents WHERE id = ?', [id]);
        console.log("Select result:", rows);

        // Clean up
        await connection.query('DELETE FROM agents WHERE id = ?', [id]);
        console.log("Cleanup done.");
    } catch (err) {
        console.error("SQL ERROR:", err);
    } finally {
        await connection.end();
    }
}

check();
