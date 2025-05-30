
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackageItem } from '@/lib/types';
import { query } from '@/lib/db';
import { formatISO, parseISO, isValid } from 'date-fns';

// Helper to ensure date strings are in a consistent format for DB or client (not used for yachts currently but good practice)
const ensureISOFormat = (dateString?: string | Date): string | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    if (isValid(dateString)) return formatISO(dateString);
    return null;
  }
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) return formatISO(parsed);
    return dateString;
  } catch {
    return dateString;
  }
};

export async function GET(request: NextRequest) {
  console.log('[API GET /api/yachts] Received request');
  try {
    const sql = `
      SELECT id, name, imageUrl, capacity, status, customPackageInfo, packages_json
      FROM yachts ORDER BY name ASC
    `;
    console.log('[API GET /api/yachts] Executing SQL:', sql.trim());
    const yachtsDataDb: any[] = await query(sql);
    console.log('[API GET /api/yachts] Raw DB Data (first item if any):', yachtsDataDb.length > 0 ? yachtsDataDb[0] : 'No yachts from DB');

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
      let packages: YachtPackageItem[] = [];
      if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
        try {
          const parsedPackages = JSON.parse(dbYacht.packages_json);
          if (Array.isArray(parsedPackages)) {
            packages = parsedPackages.map((pkg: any) => ({
              id: String(pkg.id || `pkg-${Date.now()}-${Math.random()}`),
              name: String(pkg.name || 'Unnamed Package'),
              rate: Number(pkg.rate || 0),
            }));
          } else {
            console.warn(`[API GET /api/yachts] Parsed packages_json for yacht ID ${dbYacht.id} is not an array.`);
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts] Failed to parse packages_json for yacht ID ${dbYacht.id}:`, (e as Error).message, "Raw JSON:", dbYacht.packages_json);
        }
      }

      const yacht: Yacht = {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || 'Unnamed Yacht'),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        packages: packages,
      };
      return yacht;
    });

    console.log('[API GET /api/yachts] Mapped Yachts Data (first item if any):', yachts.length > 0 ? JSON.parse(JSON.stringify(yachts[0])) : 'No yachts mapped');
    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/yachts] Failed to fetch yachts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch yachts. Check server logs.', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[API POST /api/yachts] Received request');
  try {
    const newYachtData = await request.json() as Omit<Yacht, 'id'> & { id?: string };
    console.log('[API POST /api/yachts] Received data:', newYachtData);

    if (!newYachtData.id || !newYachtData.name || newYachtData.capacity === undefined) {
      return NextResponse.json({ message: 'Missing required yacht fields (id, name, capacity)' }, { status: 400 });
    }
    
    const existingYachts: any[] = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYachts.length > 0) {
        return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    }

    const packagesJson = newYachtData.packages ? JSON.stringify(newYachtData.packages) : null;

    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status, customPackageInfo, packages_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      newYachtData.id,
      newYachtData.name,
      newYachtData.imageUrl || null,
      Number(newYachtData.capacity || 0),
      newYachtData.status || 'Available',
      newYachtData.customPackageInfo || null,
      packagesJson,
    ];

    console.log('[API POST /api/yachts] Executing SQL:', sql.trim(), 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const createdYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtQuery.length > 0) {
        const dbYacht = createdYachtQuery[0];
        let packages: YachtPackageItem[] = [];
        if (dbYacht.packages_json) {
          try { packages = JSON.parse(dbYacht.packages_json); } catch (e) { console.warn('Error parsing packages_json on created yacht fetch'); }
        }
        const finalYacht: Yacht = {
            id: String(dbYacht.id || ''),
            name: String(dbYacht.name || ''),
            imageUrl: dbYacht.imageUrl || undefined,
            capacity: Number(dbYacht.capacity || 0),
            status: (dbYacht.status || 'Available') as Yacht['status'],
            customPackageInfo: dbYacht.customPackageInfo || undefined,
            packages: packages,
        };
        console.log('[API POST /api/yachts] Successfully created yacht:', finalYacht.id);
        return NextResponse.json(finalYacht, { status: 201 });
      }
       console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation. Returning original payload.');
       const fallbackYacht: Yacht = { ...newYachtData } as Yacht; 
       return NextResponse.json(fallbackYacht, { status: 201 });
    } else {
      console.error('[API POST /api/yachts] Failed to insert yacht into database, affectedRows not 1.');
      throw new Error('Failed to insert yacht into database');
    }
  } catch (error) {
    console.error('[API POST /api/yachts] Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht. Check server logs.', error: (error as Error).message }, { status: 500 });
  }
}
