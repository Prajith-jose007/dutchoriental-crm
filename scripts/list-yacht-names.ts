import { query } from '../src/lib/db';

async function main() {
    try {
        const results = await query<any[]>('SELECT id, name FROM yachts');
        console.log('--- Current Yachts in DB ---');
        if (Array.isArray(results)) {
            results.forEach(y => console.log(`"${y.name}" (ID: ${y.id})`));
        } else {
            console.log('Results is not an array:', results);
        }
    } catch (error) {
        console.error('Error fetching yachts:', error);
    }
}

main();
