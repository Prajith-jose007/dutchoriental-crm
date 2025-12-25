import 'dotenv/config';
import { query, closePool } from '../src/lib/db';

async function testConnection() {
    try {
        console.log('Testing database connection...');
        const result = await query('SELECT 1 as val');
        console.log('Connection successful:', result);
    } catch (error) {
        console.error('Connection failed:', error);
    } finally {
        await closePool();
    }
}

testConnection();
