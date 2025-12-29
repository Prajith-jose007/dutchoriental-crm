
import { query, closePool } from '../src/lib/db';
import { compare } from 'bcryptjs';

async function verifyLogin() {
    const email = 'admin@dutchoriental.com';
    const passwordCandidate = 'Dutch@123#';

    console.log(`Verifying login for ${email} with password '${passwordCandidate}'...`);

    try {
        const users = await query<any[]>('SELECT password FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            console.log('User not found in DB.');
            return;
        }

        const dbPassword = users[0].password;
        console.log('Stored Hash:', dbPassword);

        const isMatch = await compare(passwordCandidate, dbPassword);
        console.log('Bcrypt Compare Result:', isMatch);

        if (isMatch) {
            console.log('SUCCESS: Password matches.');
        } else {
            console.log('FAILURE: Password does NOT match.');
            // Let's try to see if it matches the default '123456' just in case
            const isMatchDefault = await compare('123456', dbPassword);
            if (isMatchDefault) {
                console.log('WARNING: It matches the default password "123456" instead.');
            }
        }

    } catch (error) {
        console.error('Error verifying login:', error);
    } finally {
        await closePool();
    }
}

verifyLogin();
