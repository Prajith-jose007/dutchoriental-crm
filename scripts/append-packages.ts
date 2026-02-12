import { query } from '../src/lib/db';

async function appendMissingPackages() {
    console.log('Checking and appending missing packages...');

    const yachts = await query<any[]>('SELECT id, name, packages_json FROM yachts WHERE name LIKE "%SIGHTSEEING%"');

    for (const yacht of yachts) {
        let packages = [];
        try {
            if (yacht.packages_json) {
                packages = JSON.parse(yacht.packages_json);
            }
        } catch (e) {
            console.error(`Error parsing packages for ${yacht.name}:`, e);
            continue;
        }

        let updated = false;

        // Check for BASIC
        if (!packages.find((p: any) => p.name.toUpperCase() === 'BASIC')) {
            console.log(`Adding BASIC to ${yacht.name}`);
            packages.push({ id: `new-basic-${Date.now()}`, name: 'BASIC', rate: 99 });
            updated = true;
        }

        // Check for STANDARD
        if (!packages.find((p: any) => p.name.toUpperCase() === 'STANDARD')) {
            console.log(`Adding STANDARD to ${yacht.name}`);
            packages.push({ id: `new-standard-${Date.now()}`, name: 'STANDARD', rate: 149 });
            updated = true;
        }

        // Check for VIP
        if (!packages.find((p: any) => p.name.toUpperCase() === 'VIP')) {
            // We have VIP ADULT/VIP CHILD/VIP ALC but code looks for "VIP" exactly for Sightseeing column?
            // page.tsx line 138: { actualPackageName: 'VIP', category: 'Superyacht Sightseeing Cruise' }
            // So if we map to "VIP", it expects "VIP". 
            // If CSV has "VIP", we likely map to pkg_vip_adult (VIP ADULT) or pkg_vip (VIP).
            // If user has column "VIP" in CSV, they probably map to pkg_vip.
            // Let's add generic "VIP" too if missing.
            console.log(`Adding VIP to ${yacht.name}`);
            packages.push({ id: `new-vip-${Date.now()}`, name: 'VIP', rate: 299 });
            updated = true;
        }

        if (updated) {
            await query('UPDATE yachts SET packages_json = ? WHERE id = ?', [JSON.stringify(packages), yacht.id]);
            console.log(`Updated ${yacht.name}`);
        } else {
            console.log(`No updates needed for ${yacht.name}`);
        }
    }
}

appendMissingPackages();
