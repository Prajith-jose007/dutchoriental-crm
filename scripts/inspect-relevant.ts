import { query } from '../src/lib/db';

async function inspectRawPackages() {
    const yachts = await query<any[]>('SELECT name, packages_json FROM yachts WHERE name LIKE "%SIGHTSEEING%" OR name LIKE "%CALYPSO%" OR name LIKE "%MANSOUR%"');
    yachts.forEach(y => {
        console.log(`\n${y.name}:`);
        console.log(`  Length: ${y.packages_json?.length}`);
        console.log(`  Content: "${y.packages_json}"`);
    });
}

inspectRawPackages();
