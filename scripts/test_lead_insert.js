
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function testInsert() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        port: parseInt(process.env.DB_PORT || '3306'),
    });

    try {
        const sql = "INSERT INTO leads (id, clientName, customAgentName) VALUES (?, ?, ?)";
        const [result] = await connection.query(sql, ["TEST-LEAD-" + Date.now(), "Test Client", "Test Agent"]);
        console.log("Insert successful:", result);

        // Cleanup
        await connection.query("DELETE FROM leads WHERE id LIKE 'TEST-LEAD-%'");
        console.log("Cleanup successful.");
    } catch (err) {
        console.error("INSERT FAILED:", err.message);
    } finally {
        await connection.end();
    }
}

testInsert();
