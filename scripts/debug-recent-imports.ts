
import { query, closePool } from '../src/lib/db';

async function main() {
    try {
        console.log('--- Debugging Most Recent Imports ---');

        // Fetch last 10 leads to see the most recent imports
        const recentLeads = await query<any[]>(`
      SELECT id, clientName, yacht, package_quantities_json, totalAmount, createdAt, notes
      FROM leads 
      ORDER BY createdAt DESC 
      LIMIT 10
    `);

        if (recentLeads.length === 0) {
            console.log('No leads found.');
        } else {
            recentLeads.forEach(lead => {
                console.log(`\n---------------------------------------------------`);
                console.log(`ID:         ${lead.id}`);
                console.log(`Client:     ${lead.clientName}`);
                console.log(`Yacht:      ${lead.yacht}`);
                console.log(`Created:    ${lead.createdAt}`);
                console.log(`Amount:     ${lead.totalAmount}`);
                console.log(`Notes:      ${lead.notes}`);

                try {
                    const pkgs = JSON.parse(lead.package_quantities_json);
                    console.log('Packages:');
                    if (Array.isArray(pkgs) && pkgs.length > 0) {
                        pkgs.forEach((p: any) => {
                            console.log(`  - ${p.packageName}: ${p.quantity} @ ${p.rate}`);
                        });
                    } else {
                        console.log('  (No packages or empty array)');
                    }
                } catch (e) {
                    console.log('  (Invalid JSON for packages)');
                    console.log('  Raw:', lead.package_quantities_json);
                }
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await closePool();
    }
}

main();
