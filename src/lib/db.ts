
// src/lib/db.ts
// You MUST install mysql2: npm install mysql2
// Ensure your .env.local file has DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE, DB_PORT

import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getPool() {
  if (pool) {
    return pool;
  }
  // Check if environment variables are loaded
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_DATABASE) {
    console.error('Database environment variables (DB_HOST, DB_USER, DB_DATABASE) are not set.');
    // For local development and scripts, you might want to load dotenv explicitly
    // if not using Next.js's automatic loading (e.g., in a standalone script)
    // require('dotenv').config({ path: '.env.local' }); // Potentially needed for scripts
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, // Password can be undefined or empty string if not set
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Adjust as needed
    queueLimit: 0,
    // ssl: {
    //   // Required for some cloud DB providers like PlanetScale
    //   // rejectUnauthorized: true, // Adjust based on your SSL certificate setup
    //   // ca: fs.readFileSync('/path/to/your/ca-certificate.pem').toString(), // If using a custom CA
    // }
  });

  console.log('MySQL Pool created successfully.');
  return pool;
}

/**
 * Executes a SQL query.
 * @param sql The SQL query string.
 * @param params Optional parameters for the SQL query.
 * @returns A promise that resolves with the query results.
 */
export async function query(sql: string, params?: any[]): Promise<any> {
  try {
    const dbPool = getPool();
    console.log(`Executing SQL: ${sql}`, params || '');
    const [results] = await dbPool.execute(sql, params);
    console.log(`SQL executed successfully. Results count: ${(results as any[]).length}`);
    return results;
  } catch (error) {
    console.error('Database query error:', (error as Error).message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    console.error('Full error object:', error);
    // Re-throw the error or handle it as per your application's error handling strategy
    // For API routes, this might mean returning a 500 status code
    throw new Error(`Database query failed: ${(error as Error).message}`);
  }
}

// Example of how you might close the pool when the application shuts down (more relevant for standalone scripts)
// For Next.js serverless functions, connections are typically managed per request or with a short-lived pool.
// process.on('exit', () => {
//   if (pool) {
//     pool.end();
//     console.log('MySQL pool closed.');
//   }
// });
