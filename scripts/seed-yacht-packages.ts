import { query } from '../src/lib/db';

async function seedPackages() {
    console.log('Seeding missing yacht packages...');

    const updates = [
        {
            nameMatch: 'SIGHTSEEING',
            packages: [
                { id: 'ss-basic', name: 'BASIC', rate: 99 },
                { id: 'ss-std', name: 'STANDARD', rate: 149 },
                { id: 'ss-vip', name: 'VIP', rate: 249 }
            ]
        },
        {
            nameMatch: 'AL MANSOUR',
            packages: [
                { id: 'am-adult', name: 'ADULT', rate: 99 },
                { id: 'am-child', name: 'CHILD', rate: 79 }
            ]
        },
        {
            nameMatch: 'CALYPSO',
            packages: [
                { id: 'cal-adult', name: 'ADULT', rate: 99 },
                { id: 'cal-child', name: 'CHILD', rate: 79 }
            ]
        }
    ];

    try {
        const yachts = await query<any[]>('SELECT id, name, packages_json FROM yachts');

        for (const def of updates) {
            const targetYacht = yachts.find(y => y.name.toUpperCase().includes(def.nameMatch));
            if (targetYacht) {
                // Only update if empty or null
                if (!targetYacht.packages_json || targetYacht.packages_json === '[]' || targetYacht.packages_json === 'null') {
                    console.log(`Updating ${targetYacht.name} with default packages...`);
                    await query('UPDATE yachts SET packages_json = ? WHERE id = ?', [JSON.stringify(def.packages), targetYacht.id]);
                } else {
                    console.log(`Skipping ${targetYacht.name} (Packages already exist).`);
                }
            } else {
                console.warn(`Yacht matching "${def.nameMatch}" not found in DB.`);
            }
        }
        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seeding error:', error);
    }
}

seedPackages();
