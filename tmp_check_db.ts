import { query, closePool } from './src/lib/db';

async function checkSchema() {
  try {
    const columns = await query<any[]>('DESCRIBE leads');
    console.log('Columns in leads table:');
    columns.forEach(c => console.log(`${c.Field}: ${c.Type}`));
  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await closePool();
  }
}

checkSchema();
