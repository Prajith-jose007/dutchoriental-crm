
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackageItem } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('[API GET /api/yachts] Received request');
  try {
    const yachtsDataDb: any[] = await query(
      `SELECT id, name, imageUrl, capacity, status, customPackageInfo, packages_json
       FROM yachts ORDER BY name ASC`
    );
    console.log('[API GET /api/yachts] Raw DB Data (first item if any):', yachtsDataDb.length > 0 ? yachtsDataDb[0] : "No yachts from DB");

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
      let parsedPackages: YachtPackageItem[] = [];
      if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
        try {
          const tempParsed = JSON.parse(dbYacht.packages_json);
          if (Array.isArray(tempParsed)) {
            parsedPackages = tempParsed.map((item: any, index: number) => ({
              id: String(item.id || `pkg-${dbYacht.id}-${index}-${Date.now()}`),
              name: String(item.name || 'Unnamed Package'),
              rate: Number(item.rate || 0),
            }));
          } else {
            console.warn(`[API GET /api/yachts] Parsed packages_json for yacht ${dbYacht.id} is not an array. Found:`, tempParsed);
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts] Failed to parse packages_json for yacht ${dbYacht.id}:`, (e as Error).message, "Raw JSON:", dbYacht.packages_json);
        }
      } else if (dbYacht.packages_json) {
         console.warn(`[API GET /api/yachts] packages_json for yacht ${dbYacht.id} is not a string. Found:`, typeof dbYacht.packages_json, "Value:", dbYacht.packages_json);
      }

      return {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || 'Unnamed Yacht'),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        customPackageInfo: dbYacht.customPackageInfo || undefined,
        packages: parsedPackages,
      };
    });

    console.log('[API GET /api/yachts] Mapped Yachts Data (first item if any):', yachts.length > 0 ? yachts[0] : "No yachts mapped");
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

    const packagesJsonString = newYachtData.packages && Array.isArray(newYachtData.packages)
      ? JSON.stringify(newYachtData.packages)
      : null;

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
      packagesJsonString,
    ];

    console.log('[API POST /api/yachts] Executing SQL:', sql.trim(), 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      const createdYachtQuery: any[] = await query('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtQuery.length > 0) {
        const dbYacht = createdYachtQuery[0];
        let parsedPackages: YachtPackageItem[] = [];
         if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
          try {
            parsedPackages = JSON.parse(dbYacht.packages_json);
            if (!Array.isArray(parsedPackages)) parsedPackages = [];
          } catch (e) {
            console.warn(`[API POST /api/yachts] Error parsing packages_json for newly created yacht ${dbYacht.id}:`, (e as Error).message);
            parsedPackages = [];
          }
        }
        const finalYacht: Yacht = {
            id: String(dbYacht.id || ''),
            name: String(dbYacht.name || ''),
            imageUrl: dbYacht.imageUrl || undefined,
            capacity: Number(dbYacht.capacity || 0),
            status: (dbYacht.status || 'Available') as Yacht['status'],
            customPackageInfo: dbYacht.customPackageInfo || undefined,
            packages: parsedPackages,
        };
        console.log('[API POST /api/yachts] Successfully created yacht:', finalYacht.id);
        return NextResponse.json(finalYacht, { status: 201 });
      }
      console.warn('[API POST /api/yachts] Yacht inserted, but failed to fetch for confirmation.');
      const fallbackYacht = { ...newYachtData, id: newYachtData.id!, packages: newYachtData.packages || [] };
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
