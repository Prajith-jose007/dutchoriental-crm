
// src/app/api/yachts/route.ts
import { NextResponse } from 'next/server';
import type { Yacht, YachtPackageItem } from '@/lib/types';
import { query } from '@/lib/db';

interface DbYacht extends Yacht {
  packages_json?: string;
}

export async function GET() {
  try {
    const sql = `
      SELECT id, name, imageUrl, capacity, status, category, 
             customPackageInfo, packages_json 
      FROM yachts ORDER BY name ASC
    `;
    const yachtsDataDb = await query<DbYacht[]>(sql);

    const yachts: Yacht[] = yachtsDataDb.map(dbYacht => {
      let packages: YachtPackageItem[] = [];
      if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
        try {
          const parsedPackages = JSON.parse(dbYacht.packages_json);
          if (Array.isArray(parsedPackages)) {
            packages = parsedPackages.map((pkg: any) => ({
              id: String(pkg.id),
              name: String(pkg.name),
              rate: Number(pkg.rate || 0),
            }));
          }
        } catch (e) {
          console.warn(`[API GET /api/yachts] Failed to parse packages_json for yacht ${dbYacht.id}.`);
        }
      }

      return {
        id: String(dbYacht.id || ''),
        name: String(dbYacht.name || 'Unnamed Yacht'),
        imageUrl: dbYacht.imageUrl || undefined,
        capacity: Number(dbYacht.capacity || 0),
        status: (dbYacht.status || 'Available') as Yacht['status'],
        category: (dbYacht.category || 'Private Cruise') as Yacht['category'],
        packages: packages,
        customPackageInfo: dbYacht.customPackageInfo || undefined,
      };
    });

    return NextResponse.json(yachts, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API GET /api/yachts] Failed to fetch yachts:', error);
    return NextResponse.json({ message: `Failed to fetch yachts: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newYachtData = await request.json() as Omit<Yacht, 'id'> & { id?: string };

    if (!newYachtData.id || !newYachtData.name || newYachtData.capacity === undefined || !newYachtData.category) {
      return NextResponse.json({ message: 'Missing required yacht fields' }, { status: 400 });
    }

    const existingYachts = await query<any[]>('SELECT id FROM yachts WHERE id = ?', [newYachtData.id]);
    if (existingYachts.length > 0) {
      return NextResponse.json({ message: `Yacht already exists.` }, { status: 409 });
    }

    const packagesJson = newYachtData.packages && Array.isArray(newYachtData.packages)
      ? JSON.stringify(newYachtData.packages.map(p => ({ id: p.id, name: p.name, rate: Number(p.rate || 0) })))
      : null;

    const sql = `
      INSERT INTO yachts (
        id, name, imageUrl, capacity, status, category, packages_json, customPackageInfo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      newYachtData.id, newYachtData.name, newYachtData.imageUrl || null,
      Number(newYachtData.capacity || 0), newYachtData.status || 'Available',
      newYachtData.category, packagesJson, newYachtData.customPackageInfo || null,
    ];

    const result = await query<any>(sql, params);

    if (result.affectedRows === 1) {
      const createdYachtDb = await query<any[]>('SELECT * FROM yachts WHERE id = ?', [newYachtData.id]);
      if (createdYachtDb.length > 0) {
        const dbYacht = createdYachtDb[0];
        let packages: YachtPackageItem[] = [];
        if (dbYacht.packages_json && typeof dbYacht.packages_json === 'string') {
          try {
            packages = JSON.parse(dbYacht.packages_json);
          } catch (e) {
            console.warn(`[API POST /api/yachts] Failed to parse packages_json.`);
          }
        }
        const finalYacht: Yacht = {
          id: String(dbYacht.id),
          name: String(dbYacht.name),
          imageUrl: dbYacht.imageUrl || undefined,
          capacity: Number(dbYacht.capacity || 0),
          status: (dbYacht.status || 'Available') as Yacht['status'],
          category: (dbYacht.category || 'Private Cruise') as Yacht['category'],
          packages: packages,
          customPackageInfo: dbYacht.customPackageInfo || undefined,
        };
        return NextResponse.json(finalYacht, { status: 201 });
      }
    }
    throw new Error('Failed to insert yacht into database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API POST /api/yachts] Failed to create yacht:', error);
    return NextResponse.json({ message: `Failed to create yacht: ${errorMessage}` }, { status: 500 });
  }
}
