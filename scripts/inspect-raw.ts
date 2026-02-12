import { query } from '../src/lib/db';

async function inspectRawPackages() {
    const yachts = await query<any[]>('SELECT name, packages_json FROM yachts');
    yachts.forEach(y => {
        console.log(`\n${y.name}:`);
        console.log(`  Length: ${y.packages_json?.length}`);
        console.log(`  Content: "${y.packages_json}"`);
    });
}

inspectRawPackages();
