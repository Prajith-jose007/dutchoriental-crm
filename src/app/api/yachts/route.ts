
// src/app/api/yachts/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import type { Yacht, YachtPackage } from '@/lib/types';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('[API GET /api/yachts] Received request');
  try {
    const yachtsDataDb: any[] = await query('SELECT * FROM yachts ORDER BY name ASC');
    console.log('[API GET /api/yachts] Raw DB Data (first item):', yachtsDataDb.length > 0 ? yachtsDataDb[0] : "No yachts from DB");

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
      let packages: YachtPackage[] = [];
      if (dbYacht.packages_json) {
        try {
          packages = JSON.parse(dbYacht.packages_json);
          if (!Array.isArray(packages)) {
            console.warn(`[API GET /api/yachts] packages_json for yacht ${dbYacht.id} did not parse to an array, defaulting to empty. Value:`, dbYacht.packages_json);
            packages = [];
          }
        } catch (e) {
          console.error(`[API GET /api/yachts] Error parsing packages_json for yacht ${dbYacht.id}:`, e, "Value:", dbYacht.packages_json);
          packages = [];
        }
      }
      return {
        id: dbYacht.id,
        name: dbYacht.name,
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: dbYacht.status || 'Available',
        packages: packages,
        customPackageInfo: dbYacht.customPackageInfo || undefined,
      };
    });
    console.log('[API GET /api/yachts] Mapped Yachts Data (first item with parsed packages):', yachts.length > 0 ? yachts[0] : "No yachts mapped");
    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    console.error('[API GET /api/yachts] Failed to fetch yachts:', error);
    return NextResponse.json({ message: 'Failed to fetch yachts', error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('[API POST /api/yachts] Received request');
  try {
    const newYachtData = await request.json() as Yacht; // Expect full Yacht object
    console.log('[API POST /api/yachts] Received data:', newYachtData);

    if (!newYachtData.id || !newYachtData.name || newYachtData.capacity === undefined) {
      return NextResponse.json({ message: 'Missing required yacht fields (id, name, capacity)' }, { status: 400 });
    }
    
    const existingYacht: any = await query('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYacht.length > 0) {
      return NextResponse.json({ message: `Yacht with ID ${newYachtData.id} already exists.` }, { status: 409 });
    }
    
    const packagesJson = Array.isArray(newYachtData.packages) ? JSON.stringify(newYachtData.packages) : null;

    const yachtToStore = {
      id: newYachtData.id,
      name: newYachtData.name,
      capacity: Number(newYachtData.capacity),
      status: newYachtData.status || 'Available',
      imageUrl: newYachtData.imageUrl || null,
      packages_json: packagesJson,
      customPackageInfo: newYachtData.customPackageInfo || null,
    };
    
    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status,
        packages_json, customPackageInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      yachtToStore.id, yachtToStore.name, yachtToStore.imageUrl, yachtToStore.capacity, yachtToStore.status,
      yachtToStore.packages_json, yachtToStore.customPackageInfo
    ];
    
    console.log('[API POST /api/yachts] Executing SQL:', sql, 'with params:', params);
    const result: any = await query(sql, params);
    console.log('[API POST /api/yachts] DB Insert Result:', result);

    if (result.affectedRows === 1) {
      // Return the yacht object as it was sent by the client (with parsed packages)
      const createdYacht: Yacht = { 
        ...newYachtData, // Use the input data which has packages already parsed
        status: newYachtData.status || 'Available', // ensure status default
        imageUrl: newYachtData.imageUrl || undefined,
        customPackageInfo: newYachtData.customPackageInfo || undefined,
      };
      return NextResponse.json(createdYacht, { status: 201 });
    } else {
      console.error('[API POST /api/yachts] Failed to insert yacht into database, affectedRows not 1.');
      throw new Error('Failed to insert yacht into database');
    }
    
  } catch (error) {
    console.error('[API POST /api/yachts] Failed to create yacht:', error);
    return NextResponse.json({ message: 'Failed to create yacht', error: (error as Error).message }, { status: 500 });
  }
}
