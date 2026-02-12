import { query } from '../src/lib/db';

async function listPackages() {
    try {
        const yachts = await query<any[]>('SELECT * FROM yachts');
        for (const yacht of yachts) {
            console.log(`\n--- Yacht: ${yacht.name} (${yacht.category || 'No Category'}) ---`);

            // Check both possible column names just in case
            const packagesJson = yacht.packages_json || yacht.packages;

            if (packagesJson && typeof packagesJson === 'string') {
                try {
                    const packages = JSON.parse(packagesJson);
                    if (Array.isArray(packages)) {
                        packages.forEach((pkg: any) => {
                            console.log(`  Package: "${pkg.name}" (Rate: ${pkg.rate})`);
                        });
                    } else {
                        console.log(`  (Packages JSON is not an array: ${packagesJson})`);
                    }
                } catch (e) {
                    console.error(`  Error parsing packages JSON: ${e}`);
                }
            } else {
                console.log(`  (No packages_json found)`);
            }
        }
    } catch (error) {
        console.error('Error fetching yachts:', error);
    }
}

listPackages();
