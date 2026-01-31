
import { query, closePool } from '../src/lib/db';
import { hash } from 'bcryptjs';

async function createAdminUser() {
    try {
        const email = 'it@megayacht';
        const password = 'DOVM-Ad45';
        const hashedPassword = await hash(password, 10);
        const userId = 'DO-it-admin';
        const name = 'IT Super Admin';
        const designation = 'Super Admin';

        console.log(`Creating user with email: ${email}...`);

        // Upsert user
        const sql = `
      INSERT INTO users (id, name, email, designation, status, password) 
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        designation = VALUES(designation), 
        status = VALUES(status),
        password = VALUES(password);
    `;

        await query(sql, [
            userId,
            name,
            email,
            designation,
            'Active',
            hashedPassword
        ]);

        console.log(`User created/updated successfully: ${email}`);

    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await closePool();
    }
}

createAdminUser();
