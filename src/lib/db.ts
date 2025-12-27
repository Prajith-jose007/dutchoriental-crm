
// src/lib/db.ts
// You MUST install mysql2: npm install mysql2
// Ensure your .env.local file has DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config(); // Load default .env file

let pool: mysql.Pool | null = null;

function getPool() {
  if (pool) {
    return pool;
  }

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_DATABASE) {
    console.error('CRITICAL: Database environment variables are not set. Please check your .env.local file.');
    throw new Error('Database environment variables are not configured.');
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log('MySQL Pool created successfully.');
  return pool;
}


export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    console.log(`Executing SQL: ${sql}`, params || '');
    const [results] = await connection.execute(sql, params);
    console.log(`SQL executed successfully. Result count: ${(results as unknown[]).length}`);
    return results as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown database error occurred.';
    console.error('DATABASE QUERY FAILED:');
    console.error('SQL:', sql);
    console.error('Params:', params);
    console.error('Error Message:', errorMessage);
    console.error('Full Error Object:', error);
    // Re-throw a standardized error to be caught by the API route handlers
    throw new Error(`Database Query Failed: ${errorMessage}`);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Function to safely close the pool, useful for scripts
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('MySQL pool closed.');
  }
}
